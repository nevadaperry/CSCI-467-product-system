import ReactDOM from 'react-dom/client';
import {
  BrowserRouter,
  Route,
  Routes,
  NavLink as RouterNavLink,
} from 'react-router-dom';
import Home from './Home';
import CustomerHome from './Customer/CustomerHome';
import AdminHome from './Admin/AdminHome';
import ShippingHome from './Shipping/ShippingHome';
import ReceivingHome from './Receiving/ReceivingHome';
import React from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGaugeHigh } from '@fortawesome/free-solid-svg-icons';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import './global.scss';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <BrowserRouter>
    <div className="container ps-outermost">
      <Nav className="ps-nav" pills>
        <NavItem>
          <NavLink tag={RouterNavLink} to="/">
            <span className="ps-bold">
              <FontAwesomeIcon icon={faGaugeHigh} />
              &nbsp;Product System
            </span>
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink tag={RouterNavLink} to="/customer">
            Customer
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink tag={RouterNavLink} to="/admin">
            Admin
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink tag={RouterNavLink} to="/shipping">
            Shipping
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink tag={RouterNavLink} to="/receiving">
            Receiving
          </NavLink>
        </NavItem>
      </Nav>
      <Routes>
        <Route path="/" element={<Home />}></Route>
        <Route path="/customer" element={<CustomerHome />}></Route>
        <Route path="/admin" element={<AdminHome />}></Route>
        <Route path="/shipping" element={<ShippingHome />}></Route>
        <Route path="/receiving" element={<ReceivingHome />}></Route>
      </Routes>
    </div>
  </BrowserRouter>
);
