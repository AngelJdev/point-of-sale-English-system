import React from 'react';
import { Search } from 'lucide-react';
import './SearchBar.css';

const SearchBar = ({ searchTerm, setSearchTerm, placeholder = "Escanea o escribe código, nombre, marca..." }) => {
  return (
    <div className="search-bar-container">
      <Search className="search-icon" size={36} />
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        autoFocus
      />
    </div>
  );
};

export default SearchBar;
