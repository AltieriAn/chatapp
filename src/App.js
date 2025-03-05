import "./App.css";
import React, { useState } from "react";
import { WebPubSubClient } from "@azure/web-pubsub-client";

function UserChat({ from, message }) {
  return (
    <div className="align-self-start">
      <small className="text-muted font-weight-light">from {from}</small>
      <p className="alert alert-primary text-break">{message}</p>
    </div>
  );
}

function SelfChat({ message }) {
  return <div className="align-self-end alert-success alert">{message}</div>;
}

function SystemMessage({ message }) {
  return <div className="text-center text-muted my-2"><small>{message}</small></div>;
}

const App = () => {
  const [user, setUser] = useState("");
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [connected, setConnected] = useState(false);
  const [client, setClient] = useState(null);

  const connect = async () => {
    try {
      if(user === "") throw new Error("Username non valido");

      const response = await fetch(`https://fachatapp001.azurewebsites.net/api/GetTokenByUserId?userId=${user}`);
      // const response = await fetch(`http://localhost:7071/api/GetTokenByUserId?userId=${user}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const client = new WebPubSubClient({
        getClientAccessUrl: data.token,
      });

      //Qui metto in ascolto il client per ricevere messaggi
      //server-message è un evento predefinito di WebPubSub
      client.on("server-message", (e) => {
        alert(`${e.message.data.text} per l'utente ${e.message.data.userId}`);
      });
      await client.start();   

      setConnected(true);
      setClient(client);
    } catch (error) {
      console.error("Errore durante la connessione:", error);
    }
  }

  const send = async () => {
    // await fetch(`http://localhost:7071/api/FakeOperation?userId=${user}`);
    await fetch(`https://fachatapp001.azurewebsites.net/api/FakeOperation?userId=${user}`);
  }

  const loginPage = (
    <div className="d-flex h-100 flex-column justify-content-center container">
      <div className="input-group m-3">
        <input
          autoFocus
          type="text"
          className="form-control"
          placeholder="Username"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        ></input>
        <div className="input-group-append">
          <button
            className="btn btn-primary"
            type="button"
            disabled={!user}
            onClick={connect}
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );

  const messagePage = (
    <div className="h-100 container">
      <div className="chats d-flex flex-column m-2 p-2 bg-light h-100 overflow-">
        {chats.map((item, index) => {
          if (item.type === "USER_JOINED") {
            return <SystemMessage key={index} message={item.message} />;
          } else if (item.from === user) {
            return <SelfChat key={index} message={item.message} />;
          } else {
            return <UserChat key={index} from={item.from} message={item.message} />;
          }
        })}
      </div>
      <div className="input-group m-3">
        <input
          type="text"
          className="form-control"
          placeholder={`Hi ${user}, type a message`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        ></input>
        <div className="input-group-append">
          <button className="btn btn-primary" type="button" onClick={send}>
            Send
          </button>
        </div>
      </div>
    </div>
  );

  return !connected ? loginPage : messagePage;
}

export default App;
