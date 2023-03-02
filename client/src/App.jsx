import './App.css'
import io from 'socket.io-client'
import uploader from 'socket.io-file-client'
import {useState, useEffect} from 'react'

const socket = io('http://localhost:4000')

function App() {

  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])

  const [user, setUser] = useState([])

  const [login, setLogin] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    socket.emit('message', message)
    setMessage('')
  }

  const handleUser = (e) => {
    e.preventDefault()
    socket.emit('user', user, (data) => {
      if (data) {
        alert('User registrado exitosamente')
        setLogin(true)
        setUser(user)
      } else {
        alert('Username existente')
      }
    })
    setUser('')
  }

  useEffect(() => {
    const receiveMessage = (message) => {

      setMessages([...messages, {
        body: message.body,
        from: message.from
      }])
    }

    socket.on('message', receiveMessage)

    return () => {
      socket.off('message', receiveMessage)
    }
  },[messages])


  const [selectedFile, setSelectedFile] = useState(null);
  const [images, setImages] = useState([]);

  const handleFileInputChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    const fileReader = new FileReader();
    fileReader.readAsDataURL(selectedFile);
    fileReader.onload = () => {
      socket.emit("upload-file", {
        filename: selectedFile.name,
        data: fileReader.result,
      });
    };
  };

  socket.on('image-data', (data, user) => {
    const imageData = URL.createObjectURL(new Blob([data]));
    const imageObject = { id: images.length + 1, data: imageData, user: user.username };
    setImages([...images, imageObject]);
  });

  return (

    <div className='App'>
      
      { login ? 
      <>
      <div>
        <h1>EvaChat</h1>
        <h3>Username:{user}</h3>
      </div>
        {messages.map( (msg,index) => <h5 key={index}>{msg.from.username}: {msg.body}</h5>)}
        <div>
          {images.map((image) => (
            <div key={image.id}>
              <h5>{image.user} envio:</h5>
              <img src={image.data} style={{width:'100px'}}/>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit}>
          <input class= "archivo"  
            type='text' 
            onChange={e=> setMessage(e.target.value)}
            value={message}
          />          
          <button>Enviar</button>
        </form>
        <br />
        <form onSubmit={handleFormSubmit}>
          <input type="file" onChange={handleFileInputChange} />
          <button  type="submit">Enviar</button>
        </form>
      </> 
      : 
      <>
        <h1>Registrate</h1>
        <form onSubmit={handleUser}>
          <input class= "archivo" 
            type='text'
            onChange={e=> setUser(e.target.value)}
            value={user}
            placeholder='Ingresa tu nombre'
          />
          <button>Registrarme</button>
        </form>
      </>
      }

    </div>
  )
}

export default App
