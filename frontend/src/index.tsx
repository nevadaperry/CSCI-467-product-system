import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import Home from './Home';
import CustomerHome from './Customer/CustomerHome';
import AdminHome from './Admin/AdminHome';
import EmployeeHome from './Employee/EmployeeHome';
import ReceivingHome from './Receiving/ReceivingHome';
import React from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import ThemeContextWrapper from './components/ThemeWrapper/ThemeWrapper';
import BackgroundColorWrapper from './components/BackgroundColorWrapper/BackgroundColorWrapper';

import './assets/scss/black-dashboard-react.scss';
import './assets/css/nucleo-icons.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <ThemeContextWrapper>
    <BackgroundColorWrapper>
      <BrowserRouter>
        <Sidebar
          routes={[
            {
              path: '/',
              name: 'Home',
              icon: 'tim-icons icon-atom',
              component: <Home />,
            },
            {
              path: '/customer',
              name: 'Customer',
              icon: 'tim-icons icon-atom',
              component: <CustomerHome />,
            },
            {
              path: '/admin',
              name: 'Admin',
              icon: 'tim-icons icon-atom',
              component: <AdminHome />,
            },
            {
              path: '/employee',
              name: 'Employee',
              icon: 'tim-icons icon-atom',
              component: <EmployeeHome />,
            },
            {
              path: '/receiving',
              name: 'Receiving',
              icon: 'tim-icons icon-atom',
              component: <ReceivingHome />,
            },
          ]}
        />
        <Routes>
          {' '}
          {/* The Switch decides which component to show based on the current URL.*/}
          <Route path="/" element={<Home />}></Route>
          <Route path="/customer" element={<CustomerHome />}></Route>
          <Route path="/admin" element={<AdminHome />}></Route>
          <Route path="/employee" element={<EmployeeHome />}></Route>
          <Route path="/receiving" element={<ReceivingHome />}></Route>
        </Routes>
      </BrowserRouter>
    </BackgroundColorWrapper>
  </ThemeContextWrapper>
);
