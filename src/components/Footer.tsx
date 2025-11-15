import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-200 text-gray-700 p-4 mt-10">
      <div className="container mx-auto text-center">
        &copy; {new Date().getFullYear()} Diet-Nova. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
