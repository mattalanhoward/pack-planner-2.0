// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

export default function Dashboard() {
  const { logout } = useAuth();
  const [lists, setLists] = useState([]);
  const [title, setTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchLists() {
      const resp = await api.get('/lists');
      setLists(resp.data);
    }
    fetchLists();
  }, []);

  const createList = async () => {
    if (!title) return;
    const resp = await api.post('/lists', { title });
    setLists([...lists, resp.data]);
    navigate(`/lists/${resp.data._id}`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Your Gear Lists</h1>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Log Out
        </button>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map(list => (
          <Link
            key={list._id}
            to={`/lists/${list._id}`}
            className="block p-4 bg-white shadow rounded hover:bg-gray-50"
          >
            {list.title}
          </Link>
        ))}
        <div className="p-4 bg-gray-100 rounded">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="New list name"
            className="w-full mb-2 p-2 border rounded"
          />
          <button
            onClick={createList}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            Create List
          </button>
        </div>
      </div>
    </div>
  );
}

