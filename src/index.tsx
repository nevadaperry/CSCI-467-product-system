import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppHome from "./AppHome";
import CustomerHome from "./Customer/CustomerHome";
import AdminHome from "./Admin/AdminHome";
import EmployeeHome from "./Employee/EmployeeHome";
import ReceivingHome from "./Receiving/ReceivingHome";
import Navbar from "./Navbar";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <BrowserRouter>
    <Navbar />
    <Routes>
      {" "}
      {/* The Switch decides which component to show based on the current URL.*/}
      <Route path="/" element={<AppHome />}></Route>
      <Route path="/customer" element={<CustomerHome />}></Route>
      <Route path="/admin" element={<AdminHome />}></Route>
      <Route path="/employee" element={<EmployeeHome />}></Route>
      <Route path="/receiving" element={<ReceivingHome />}></Route>
    </Routes>
  </BrowserRouter>
);
