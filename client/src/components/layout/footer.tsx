import { Link } from "wouter";
import { Ship, Facebook, Twitter, Instagram } from "lucide-react";
import { FaPinterest } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  const companyLinks = [
    { name: "About Us", path: "/about" },
    { name: "Our Fleet", path: "/fleet" },
    { name: "Careers", path: "/careers" },
    { name: "Contact Us", path: "/contact" },
  ];
  
  const destinationLinks = [
    { name: "Caribbean", path: "/destinations/caribbean" },
    { name: "Mediterranean", path: "/destinations/mediterranean" },
    { name: "Alaska", path: "/destinations/alaska" },
    { name: "Europe", path: "/destinations/europe" },
    { name: "Hawaii", path: "/destinations/hawaii" },
  ];
  
  const supportLinks = [
    { name: "Help Center", path: "/help" },
    { name: "FAQs", path: "/faqs" },
    { name: "Booking Terms", path: "/terms" },
    { name: "Cancellation Policy", path: "/cancellation" },
  ];
  
  const legalLinks = [
    { name: "Privacy Policy", path: "/privacy" },
    { name: "Terms of Service", path: "/terms-of-service" },
    { name: "Cookie Policy", path: "/cookies" },
  ];

  return (
    <footer className="bg-neutral-darkest text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 font-heading flex items-center">
              <Ship className="mr-2" />
              Cruise Voyager
            </h3>
            <p className="text-neutral-medium mb-4">
              Find your perfect cruise vacation at the best prices, guaranteed.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-neutral-medium hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-neutral-medium hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-neutral-medium hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram />
              </a>
              <a 
                href="https://pinterest.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-neutral-medium hover:text-white transition-colors"
                aria-label="Pinterest"
              >
                <FaPinterest />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-4 font-heading">Company</h4>
            <ul className="space-y-2">
              {companyLinks.map(link => (
                <li key={link.path}>
                  <Link href={link.path} className="text-neutral-medium hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-4 font-heading">Destinations</h4>
            <ul className="space-y-2">
              {destinationLinks.map(link => (
                <li key={link.path}>
                  <Link href={link.path} className="text-neutral-medium hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-4 font-heading">Customer Support</h4>
            <ul className="space-y-2">
              {supportLinks.map(link => (
                <li key={link.path}>
                  <Link href={link.path} className="text-neutral-medium hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-dark mt-10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-neutral-medium text-sm mb-4 md:mb-0">
              &copy; {currentYear} Cruise Voyager. All rights reserved.
            </p>
            <div className="flex space-x-4">
              {legalLinks.map(link => (
                <Link
                  key={link.path}
                  href={link.path}
                  className="text-neutral-medium hover:text-white text-sm transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
