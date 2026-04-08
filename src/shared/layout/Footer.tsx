import { Link } from 'react-router-dom';
import { Twitter, Instagram, Linkedin } from 'lucide-react';

const footerLinks = [
  { to: '/find-tutor', label: 'Find Tutor' },
  { to: '/become-tutor', label: 'Become Tutor' },
  { to: '#', label: 'About' },
  { to: '#', label: 'Contact' },
];

const socialIcons = [
  { Icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
  { Icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
  { Icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4 md:py-16">
      <div className="container mx-auto max-w-6xl flex flex-col md:flex-row md:items-center md:justify-between gap-8">
        <div className="flex flex-col gap-4">
          <Link
            to="/"
            className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent w-fit"
          >
            BISP
          </Link>
          <div className="flex flex-wrap gap-4">
            {footerLinks.map(({ to, label }) => (
              <Link
                key={label}
                to={to}
                className="text-sm hover:text-white transition-colors duration-300"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {socialIcons.map(({ Icon, href, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-300"
              aria-label={label}
            >
              <Icon className="w-5 h-5" />
            </a>
          ))}
        </div>
      </div>
      <div className="container mx-auto max-w-6xl mt-8 pt-8 border-t border-gray-800 text-center md:text-left">
        <p className="text-sm text-gray-500">
          © {currentYear} BISP. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
