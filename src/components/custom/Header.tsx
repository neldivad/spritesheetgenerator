import React from 'react';

const Header = () => (
  <header className="sticky top-0 z-50 w-full px-8 md:px-16 py-4 flex justify-between items-center bg-black/90 backdrop-blur-lg">
    <div className="flex items-center gap-2">
      <img 
        src="https://assets.ctfassets.net/f1jeyjiun49v/6PPnMkhqzrOS8KTboivAb7/4d04cd23529a98dee74ab8d575bceba1/nelworks-logo-64.ico" 
        alt="Nelworks Icon" 
        width={32} 
        height={32} 
      />
      <img 
        src="https://images.ctfassets.net/f1jeyjiun49v/3MXCJaDwBkYYrECFB9SNXE/999b57e520842fa4089ec63640cc91ef/nelworks-long-dark.svg" 
        alt="Nelworks Logo" 
        width={120} 
        height={32}
        className="hidden md:block"
      />
    </div>
    <span className="text-lg font-bold text-white ml-4">SpriteSheet Generator</span>
  </header>
);

export default Header; 