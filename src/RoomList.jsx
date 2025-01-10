import {useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";

const RoomList = () => {
    const [rooms, setRooms] = useState([]);
    const [roomName, setRoomName] = useState('');
    useNavigate();

    useEffect(() => {
      fetch('http://localhost:8080/rooms')
          .then((res) => res.json())
          .then((data) => setRooms(data));
    }, []);

    const createRoom = () => {
      if (roomName.trim() !== '') {
        fetch('http://localhost:8080/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: roomName })
        })
            .then((res) => res.json())
            .then((room) => {
              setRooms((prev) => [...prev, room]);
              setRoomName('');
            });
      }
    };

    return (
        <div className="room-list">
            <h1>Room List</h1>
            <input
                type="text"
                placeholder="Enter room name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
            />
            <button onClick={createRoom}>Create Room</button>
            <ul>
                {rooms.map((room) => (
                    <li key={room.id}>
                        <Link to={`/room/${room.id}`}>{room.title}</Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};
export {RoomList}