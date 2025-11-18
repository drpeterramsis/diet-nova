import React from "react";

const Header: React.FC = () => {
  return (
    <header className="bg-[var(--color-primary)] text-white shadow-md">
      <div className="container mx-auto flex justify-between items-center p-4">
        <h1 className="text-2xl font-bold tracking-wide">
          Diet<span className="text-[var(--color-primary-light)]">Nova</span>
        </h1>

        <nav>
          <ul className="flex space-x-6 text-lg">
            <li>
              <a href="#" className="hover:text-[var(--color-primary-light)] transition">
                Home
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[var(--color-primary-light)] transition">
                Tools
              </a>
            </li>
            <li>
              <a href="#" className="bg-white text-[var(--color-primary)] px-4 py-1 rounded-lg hover:bg-[var(--color-primary-light)] hover:text-white transition">
                Login
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
