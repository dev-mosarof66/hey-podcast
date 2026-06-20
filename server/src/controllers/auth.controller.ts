import { NextFunction, Request, Response } from 'express';
import { User } from '../entities/User';
import { UserRepository } from '../repositories/user.repository';
import { HttpError } from '../utils/http-error';
import {
  hashPassword,
  signToken,
  verifyGoogleIdToken,
  verifyPassword,
} from '../utils/auth';

/** Shape returned to clients — never includes the password hash. */
function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    ageRange: user.ageRange,
    profession: user.profession,
    onboarded: user.onboarded,
    createdAt: user.createdAt,
  };
}

function authResponse(user: User, isNew: boolean) {
  return {
    token: signToken({ sub: user.id, email: user.email }),
    user: toPublicUser(user),
    // True for a just-created account → client sends them to onboard topics.
    isNew,
  };
}

// POST /api/auth/register  { email, password, displayName? }
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const email = String(req.body.email ?? '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password ?? '');
    const displayName = req.body.displayName ? String(req.body.displayName).trim() : null;

    if (!email || !email.includes('@')) {
      throw new HttpError(400, 'A valid email is required');
    }
    if (password.length < 8) {
      throw new HttpError(400, 'Password must be at least 8 characters');
    }

    if (await UserRepository.existsByEmail(email)) {
      throw new HttpError(409, 'An account with this email already exists');
    }

    const user = UserRepository.create({
      email,
      displayName,
      password: await hashPassword(password),
      emailVerified: false,
    });
    await UserRepository.save(user);

    res.status(201).json(authResponse(user, true));
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login  { email, password }
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const email = String(req.body.email ?? '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password ?? '');

    if (!email || !password) {
      throw new HttpError(400, 'Email and password are required');
    }

    const user = await UserRepository.findByEmailWithPassword(email);
    if (!user || !user.password) {
      // No account, or a Google-only account with no password set.
      throw new HttpError(401, 'Invalid email or password');
    }

    const ok = await verifyPassword(password, user.password);
    if (!ok) {
      throw new HttpError(401, 'Invalid email or password');
    }

    res.json(authResponse(user, false));
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/google  { idToken }
export async function googleLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const idToken = String(req.body.idToken ?? '');
    if (!idToken) {
      throw new HttpError(400, 'idToken is required');
    }

    const profile = await verifyGoogleIdToken(idToken).catch(() => {
      throw new HttpError(401, 'Invalid Google token');
    });

    // Match by googleId first, then by email (links an existing password account).
    let user =
      (await UserRepository.findByGoogleId(profile.googleId)) ??
      (await UserRepository.findByEmail(profile.email));

    const isNew = !user;

    if (!user) {
      user = UserRepository.create({
        email: profile.email,
        displayName: profile.name,
        avatarUrl: profile.picture,
        googleId: profile.googleId,
        emailVerified: profile.emailVerified,
      });
    } else if (!user.googleId) {
      // Existing email account signing in with Google for the first time.
      user.googleId = profile.googleId;
      if (!user.avatarUrl) user.avatarUrl = profile.picture;
      if (profile.emailVerified) user.emailVerified = true;
    }

    await UserRepository.save(user);
    res.json(authResponse(user, isNew));
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me  (requires auth)
export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await UserRepository.findOneBy({ id: req.user!.sub });
    if (!user) {
      throw new HttpError(404, 'User not found');
    }
    res.json(toPublicUser(user));
  } catch (err) {
    next(err);
  }
}

// PATCH /api/auth/me  { displayName?, ageRange?, profession? }
export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await UserRepository.findOneBy({ id: req.user!.sub });
    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    if (req.body.displayName !== undefined) {
      user.displayName = String(req.body.displayName).trim() || null;
    }
    if (req.body.ageRange !== undefined) {
      user.ageRange = req.body.ageRange ? String(req.body.ageRange) : null;
    }
    if (req.body.profession !== undefined) {
      user.profession = req.body.profession ? String(req.body.profession) : null;
    }
    if (req.body.onboarded !== undefined) {
      user.onboarded = Boolean(req.body.onboarded);
    }

    await UserRepository.save(user);
    res.json(toPublicUser(user));
  } catch (err) {
    next(err);
  }
}

// DELETE /api/auth/me — permanently delete the current user's account.
// Related rows cascade (follows, progress, saved, subscription, push tokens,
// notifications); the user's episodes have their userId set to null.
export async function deleteMe(req: Request, res: Response, next: NextFunction) {
  try {
    await UserRepository.delete({ id: req.user!.sub });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
