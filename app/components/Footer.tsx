import Link from "next/link";
import { Phone, Mail, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

const Column = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
    <div className="mt-3 space-y-2 text-[13px] text-gray-600">{children}</div>
  </div>
);

const A = ({ href = "#", children }: { href?: string; children: React.ReactNode }) => (
  <Link href={href} className="hover:text-gray-900">
    {children}
  </Link>
);

export default function Footer() {
  return (
    <footer className="relative mt-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* top divider */}
        <div className="h-px w-full bg-gray-200" />

        {/* top grid */}
        <div className="grid gap-10 py-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Help */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">Do You Need Help ?</h4>
            <p className="text-[13px] leading-relaxed text-gray-600">
              Autolesi gen atyp. Nisl a darsak rhoncubra. Ndr antipal kynodra nyant. Pessa rimoska.
            </p>
            <div className="mt-3 space-y-3 text-[13px] text-gray-700">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-gray-500" />
                <div>
                  Monday–Friday, 08am–08pm
                  <div className="text-base font-semibold text-gray-900">0 800 300-353</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-gray-500" />
                <div>
                  Need help with your order?
                  <div className="font-semibold">info@example.com</div>
                </div>
              </div>
            </div>
          </div>

          {/* Make Money */}
          <Column title="Make Money with Us">
            <A>Sell on Alimas</A>
            <A>Sell Your Services on Alimas</A>
            <A>Sell on Alimas Business</A>
            <A>Sell Your Apps on Alimas</A>
            <A>Become an Affiliate</A>
            <A>Advertise Your Products</A>
            <A>Self-Publish with Us</A>
            <A>Become an Vendor</A>
          </Column>

          {/* Let Us Help You */}
          <Column title="Let Us Help You">
            <A>Accessibility Statement</A>
            <A>Your Orders</A>
            <A>Returns &amp; Replacements</A>
            <A>Refund and Returns Policy</A>
            <A>Privacy Policy</A>
            <A>Terms and Conditions</A>
            <A>Cookie Settings</A>
            <A>Help Center</A>
          </Column>

          {/* Get to Know Us */}
          <Column title="Get to Know Us">
            <A>Careers for Alimas</A>
            <A>About Alimas</A>
            <A>Investor Relations</A>
            <A>Alimas Devices</A>
            <A>Customer reviews</A>
            <A>Social Responsibility</A>
            <A>Store Locations</A>
          </Column>

          {/* App & Social */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Download our app</h4>
            <div className="mt-3 space-y-2">
              {/* taruh file badge ini di /public/badges/ */}
              <a href="#" aria-label="Get it on Google Play">
                <img src="/badges/google-play-badge.svg" alt="Google Play" className="h-10 w-auto" />
              </a>
              <a href="#" aria-label="Download on the App Store">
                <img src="/badges/app-store-badge.svg" alt="App Store" className="h-10 w-auto" />
              </a>
            </div>
            <div className="mt-5 text-[13px] text-gray-600">Follow us on social media:</div>
            <div className="mt-2 flex items-center gap-3">
              <a href="#" className="rounded-full bg-gray-100 p-2 text-gray-700 hover:bg-gray-200" aria-label="Facebook"><Facebook className="h-4 w-4" /></a>
              <a href="#" className="rounded-full bg-gray-100 p-2 text-gray-700 hover:bg-gray-200" aria-label="Instagram"><Instagram className="h-4 w-4" /></a>
              <a href="#" className="rounded-full bg-gray-100 p-2 text-gray-700 hover:bg-gray-200" aria-label="Twitter"><Twitter className="h-4 w-4" /></a>
              <a href="#" className="rounded-full bg-gray-100 p-2 text-gray-700 hover:bg-gray-200" aria-label="LinkedIn"><Linkedin className="h-4 w-4" /></a>
            </div>
          </div>
        </div>

        {/* bottom divider */}
        <div className="h-px w-full bg-gray-200" />

        {/* bottom bar */}
        <div className="flex flex-col gap-4 py-6 text-[13px] text-gray-600 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <div>
              Copyright © {new Date().getFullYear()} All rights reserved. Powered by {" "}
              <a href="#" className="font-semibold text-blue-600 hover:underline">NewGen</a>.
            </div>
            <div className="flex items-center gap-3 text-gray-500">
              <span className="rounded bg-gray-100 px-2 py-0.5">VISA</span>
              <span className="rounded bg-gray-100 px-2 py-0.5">PayPal</span>
              <span className="rounded bg-gray-100 px-2 py-0.5">Skrill</span>
              <span className="rounded bg-gray-100 px-2 py-0.5">Klarna</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <A>Terms and Conditions</A>
            <A>Privacy Policy</A>
            <A>Order Tracking</A>
          </div>
        </div>
      </div>
    </footer>
  );
}