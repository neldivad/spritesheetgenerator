import React from 'react';
import { socialLinks } from '../../lib/socialConfig';

const Footer = () => (
  <footer className="w-full py-4 flex flex-col items-center gap-2 bg-black/80 text-white text-xs backdrop-blur-lg">
    <div className="flex items-center gap-2 mb-2">
      <img 
        src="https://assets.ctfassets.net/f1jeyjiun49v/6PPnMkhqzrOS8KTboivAb7/4d04cd23529a98dee74ab8d575bceba1/nelworks-logo-64.ico" 
        alt="Nelworks Icon" 
        width={20} 
        height={20} 
      />
      <span>© {new Date().getFullYear()} Nelworks. All rights reserved.</span>
    </div>
    <div className="flex gap-4">
      {socialLinks.map(link => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          title={link.description}
          className="flex items-center gap-1 hover:underline"
        >
          <img src={link.icon} alt={link.name} width={18} height={18} />
          <span>{link.name}</span>
        </a>
      ))}
    </div>
  </footer>
);

export default Footer; 