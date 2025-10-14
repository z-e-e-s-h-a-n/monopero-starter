import {
  BadRequestException,
  Injectable,
  type OnModuleInit,
} from "@nestjs/common";
import passport from "passport";
import {
  Strategy as GoogleStrategy,
  type Profile as GoogleProfile,
} from "passport-google-oauth20";
import {
  Strategy as FacebookStrategy,
  type Profile as FacebookProfile,
} from "passport-facebook";
import { EnvService } from "@/modules/env/env.service";
import { PrismaService } from "@/modules/prisma/prisma.service";
import { OtpService } from "./otp.service";
import { NotificationService } from "@/modules/notification/notification.service";

interface NormalizedProfile {
  provider: "google" | "facebook";
  id: string;
  email: string | null;
  displayName: string;
  firstName: string;
  lastName: string;
  photo?: string;
}

@Injectable()
export class OAuthService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly env: EnvService,
    private readonly notifyService: NotificationService
  ) {}

  onModuleInit() {
    this.initGoogleStrategy();
    this.initFacebookStrategy();
  }

  private initGoogleStrategy() {
    passport.use(
      "google",
      new GoogleStrategy(
        {
          clientID: this.env.get("GOOGLE_CLIENT_ID"),
          clientSecret: this.env.get("GOOGLE_CLIENT_SECRET"),
          callbackURL: this.env.get("GOOGLE_CALLBACK_URL"),
          scope: ["profile", "email"],
        },
        async (_, __, profile: GoogleProfile, done) => {
          try {
            const user = await this.validateOAuthLogin(profile);
            done(null, user);
          } catch (err) {
            done(err, false);
          }
        }
      )
    );
  }

  private initFacebookStrategy() {
    passport.use(
      "facebook",
      new FacebookStrategy(
        {
          clientID: this.env.get("FACEBOOK_CLIENT_ID"),
          clientSecret: this.env.get("FACEBOOK_CLIENT_SECRET"),
          callbackURL: this.env.get("FACEBOOK_CALLBACK_URL"),
          scope: "email",
          profileFields: ["id", "emails", "name", "displayName"],
        },
        async (_, __, profile: FacebookProfile, done) => {
          try {
            const user = await this.validateOAuthLogin(profile);
            done(null, user);
          } catch (err) {
            done(err, null);
          }
        }
      )
    );
  }

  private async validateOAuthLogin(profile: GoogleProfile | FacebookProfile) {
    const normalized = this.normalizeProfile(profile);

    if (!normalized.email) {
      throw new BadRequestException("No email found");
    }

    let user = await this.prisma.user.findUnique({
      where: { email: normalized.email },
      include: { roles: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: normalized.email,
          firstName: normalized.firstName,
          lastName: normalized.lastName,
          displayName: normalized.displayName,
          imageUrl: normalized.photo,
          isEmailVerified: true,
          password: null,
          roles: { create: [{ role: "customer" }] },
        },
        include: { roles: true },
      });

      await this.notifyService.sendNotification({
        userId: user.id,
        purpose: "signup",
        to: user.email!,
        metadata: { user },
      });
    }

    if (!user.password) {
      await this.otpService.sendOtp({
        userId: user.id,
        purpose: "setPassword",
        identifier: normalized.email,
        type: "token",
        metadata: { user },
      });
    }

    return {
      id: user.id,
      roles: user.roles.map((r) => r.role),
    };
  }

  private normalizeProfile(
    profile: GoogleProfile | FacebookProfile
  ): NormalizedProfile {
    const provider = profile.provider as "google" | "facebook";

    const email = profile.emails?.[0]?.value || null;
    const displayName =
      profile.displayName ||
      `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim();

    const firstName = profile.name?.givenName || "";
    const lastName = profile.name?.familyName || "";

    const photo = profile.photos?.[0]?.value;

    return {
      provider,
      id: profile.id,
      email,
      displayName,
      firstName,
      lastName,
      photo,
    };
  }
}
