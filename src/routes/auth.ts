import { Router } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../config/database';
import { loginSuccess, loginFailed, logout } from '../controllers/authController';

const router = Router();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: '/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0].value!;
    const name = profile.displayName;
    const googleId = profile.id;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: { email, name, googleId },
      });
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Google OAuth authentication
 */

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Login with Google
 *     tags: [Auth]
 *     description: Redirects the user to Google OAuth consent screen
 *     responses:
 *       302:
 *         description: Redirects to Google login
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 *     description: Handles the callback from Google after authentication
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Authentication failed
 */
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failed' }),
  loginSuccess
);

/**
 * @swagger
 * /auth/failed:
 *   get:
 *     summary: Authentication failed
 *     tags: [Auth]
 *     responses:
 *       401:
 *         description: Google authentication failed
 */
router.get('/failed', loginFailed);

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: Logout
 *     tags: [Auth]
 *     description: Logs out the current user
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.get('/logout', logout);

export default router;
