import dotenv from 'dotenv';
dotenv.config();
import { Router } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../config/database';

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

// Routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failed' }),
  (req, res) => {
    res.json({ message: 'Login successful', user: req.user });
  }
);

router.get('/failed', (req, res) => {
  res.status(401).json({ error: 'Google authentication failed' });
});

router.get('/logout', (req, res) => {
  req.logout(() => {
    res.json({ message: 'Logged out successfully' });
  });
});

export default router;