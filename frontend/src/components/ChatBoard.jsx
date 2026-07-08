import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const BACKEND_URL = "http://localhost:5000";

export default function ChatBoard({ username, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState("General");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [inputText, setInputText] = useState("");
  const [newRoom, setNewRoom] = useState("");

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch Rooms
  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/api/rooms`)
      .then((res) => setRooms(res.data))
      .catch((err) => console.error("Error fetching rooms:", err));
  }, []);

  // Socket Connection
  useEffect(() => {
    socketRef.current = io(BACKEND_URL);

    socketRef.current.emit("joinRoom", {
      username,
      room: currentRoom,
    });

    socketRef.current.on("chatHistory", (history) => {
      setMessages(history);
    });

    socketRef.current.on("chatMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socketRef.current.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    socketRef.current.on("typing", ({ username: typer, isTyping }) => {
      setTypingUser(isTyping ? typer : "");
    });

    // Listen for newly created rooms
    socketRef.current.on("roomCreated", (room) => {
      setRooms((prev) => {
        if (prev.some((r) => r.name === room.name)) {
          return prev;
        }
        return [...prev, room];
      });
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  // Switch Room
  useEffect(() => {
    if (socketRef.current) {
      setMessages([]);
      socketRef.current.emit("joinRoom", {
        username,
        room: currentRoom,
      });
    }
  }, [currentRoom, username]);

  // Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // Create Room
  const createRoom = async () => {
    if (!newRoom.trim()) return;

    try {
      const token = localStorage.getItem("chat_token");

      const { data } = await axios.post(
        `${BACKEND_URL}/api/rooms`,
        {
          name: newRoom,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setRooms((prev) => {
        if (prev.some((r) => r.name === data.name)) {
          return prev;
        }
        return [...prev, data];
      });

      setNewRoom("");
    } catch (err) {
      alert(err.response?.data?.message || "Unable to create room");
    }
  };

  // Send Message
  const sendMessage = (e) => {
    e.preventDefault();

    if (!inputText.trim()) return;

    socketRef.current.emit("chatMessage", {
      room: currentRoom,
      username,
      text: inputText,
    });

    setInputText("");

    socketRef.current.emit("typing", {
      room: currentRoom,
      username,
      isTyping: false,
    });
  };

  // Typing
  const handleTyping = (e) => {
    setInputText(e.target.value);

    socketRef.current.emit("typing", {
      room: currentRoom,
      username,
      isTyping: e.target.value.length > 0,
    });
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("chat_token");
    onLogout();
  };

  return (
    <div className="chat-layout">

      {/* Sidebar */}
      <div className="sidebar">

        <div className="sidebar-header">
          <span>Rooms</span>

          <span
            style={{
              cursor: "pointer",
              color: "var(--error)",
            }}
            onClick={handleLogout}
          >
            Exit
          </span>
        </div>

        {/* Create Room */}
        <div style={{ padding: "10px" }}>
          <input
            type="text"
            placeholder="New Room"
            value={newRoom}
            onChange={(e) => setNewRoom(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
            }}
          />

          <button
            className="btn"
            style={{ width: "100%" }}
            onClick={createRoom}
          >
            + Create Room
          </button>
        </div>

        {/* Room List */}
        <div className="list-section">
          {rooms.map((room) => (
            <div
              key={room._id || room.name}
              className={`room-item ${
                currentRoom === room.name ? "active" : ""
              }`}
              onClick={() => setCurrentRoom(room.name)}
            >
              # {room.name}
            </div>
          ))}
        </div>

        {/* Online Users */}
        <div
          className="sidebar-header"
          style={{
            borderTop: "1px solid #374248",
          }}
        >
          Online ({onlineUsers.length})
        </div>

        <div className="list-section">
          {onlineUsers.map((user, idx) => (
            <div
              key={idx}
              style={{
                padding: "5px 0",
                color: "var(--accent)",
              }}
            >
              ● {user} {user === username ? "(You)" : ""}
            </div>
          ))}
        </div>

      </div>

      {/* Chat Area */}
      <div className="chat-area">

        <div className="chat-header">
          #{currentRoom}
        </div>

        <div className="messages-container">
          {messages.map((msg, idx) => (
            <div
              key={msg._id || idx}
              className={`msg ${
                msg.username === username ? "me" : "them"
              }`}
            >
              {msg.username !== username && (
                <div className="msg-sender">
                  {msg.username}
                </div>
              )}

              <div>{msg.text}</div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {typingUser && (
          <div className="typing-indicator">
            {typingUser} is typing...
          </div>
        )}

        <form
          onSubmit={sendMessage}
          className="input-area"
        >
          <input
            type="text"
            placeholder="Type your message..."
            value={inputText}
            onChange={handleTyping}
            onBlur={() =>
              socketRef.current.emit("typing", {
                room: currentRoom,
                username,
                isTyping: false,
              })
            }
          />

          <button
            type="submit"
            className="btn"
            style={{
              margin: 0,
              width: "100px",
            }}
          >
            Send
          </button>
        </form>

      </div>

    </div>
  );
}