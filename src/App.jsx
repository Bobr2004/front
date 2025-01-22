import React, { useState, useEffect, useRef } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams
} from 'react-router-dom';

import {RoomList} from "./RoomList.jsx";
import {VideoRoom} from "./VideoRoom.jsx";
import "./global.css"

const App = () => {
  return (
      <Router>
        <Routes>
          <Route path="/" element={<RoomList />} />
          <Route path="/room/:roomId" element={<VideoRoom />} />
        </Routes>
      </Router>
  );
};




export default App;
