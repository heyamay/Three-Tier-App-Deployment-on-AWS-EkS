import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/tasks`).then(response => {
      setTasks(response.data);
    });
  }, []);

  const createTask = () => {
    axios.post(`${API_URL}/tasks`, { title, description }).then(response => {
      setTasks([...tasks, response.data]);
      setTitle('');
      setDescription('');
    });
  };

  const deleteTask = id => {
    axios.delete(`${API_URL}/tasks/${id}`).then(() => {
      setTasks(tasks.filter(task => task.id !== id));
    });
  };

  return (
    <div>
      <h1>Task Manager</h1>
      <div>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <button onClick={createTask}>Create Task</button>
      </div>
      <ul>
        {tasks.map(task => (
          <li key={task.id}>
            <strong>{task.title}</strong>: {task.description}
            <button onClick={() => deleteTask(task.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;