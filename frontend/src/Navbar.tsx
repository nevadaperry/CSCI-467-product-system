import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <div>
      <Link to="/">Home</Link>
      <Link to="/customer">Customer</Link>
      <Link to="/admin">Admin</Link>
      <Link to="/employee">Employee</Link>
      <Link to="/receiving">Receiving</Link>
    </div>
  );
}

export default Navbar;
