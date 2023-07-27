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
import {
  faGaugeHigh,
} from '@fortawesome/free-solid-svg-icons';

import 'bootstrap/dist/css/bootstrap.min.css';
import './global.scss';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <BrowserRouter>
    <div className="container">
      <Nav className="ps-nav" pills>
        <NavItem>
          <NavLink tag={RouterNavLink} exact to="/" activeClassName="active">
            <FontAwesomeIcon icon={faGaugeHigh} />
            &nbsp;Product System
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            tag={RouterNavLink}
            exact
            to="/customer"
            activeClassName="active"
          >
            Customer
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            tag={RouterNavLink}
            exact
            to="/admin"
            activeClassName="active"
          >
            Admin
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            tag={RouterNavLink}
            exact
            to="/shipping"
            activeClassName="active"
          >
            Shipping
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            tag={RouterNavLink}
            exact
            to="/receiving"
            activeClassName="active"
          >
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
