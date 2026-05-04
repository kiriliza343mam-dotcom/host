import React, { useState, useEffect } from 'react';
import { View, Panel } from '@vkontakte/vkui';
import bridge from '@vkontakte/vk-bridge';
import './App.css';

export default function App() {
  const [activePanel, setActivePanel] = useState('home');

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [problem, setProblem] = useState('');

  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [selectedRequest, setSelectedRequest] = useState(null); // 🔥 НОВОЕ

  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const ADMIN_ID = 321451736;

  const go = (panel) => setActivePanel(panel);

  useEffect(() => {
    const init = async () => {
      const data = await bridge.send('VKWebAppGetUserInfo');
      setUser(data);
      if (data.id === ADMIN_ID) setIsAdmin(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (activePanel === 'admin') {
      loadRequests();
      const interval = setInterval(loadRequests, 5000);
      return () => clearInterval(interval);
    }
  }, [activePanel]);

  const loadRequests = async () => {
    try {
      const res = await fetch('https://test-production-7171.up.railway.app/requests');
      const data = await res.json();
      setRequests(data);
    } catch (e) {
      console.error(e);
    }
  };

  const sendRequest = async () => {
    if (!name || !contact || !problem) {
      return bridge.send('VKWebAppShowAlert', {
        message: 'Заполните все поля ⚠️'
      });
    }

    try {
      const res = await fetch('https://test-production-7171.up.railway.app/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact, problem })
      });

      const data = await res.json();

      if (data.success) {
        bridge.send('VKWebAppShowAlert', {
          message: 'Заявка отправлена ✅'
        });

        setName('');
        setContact('');
        setProblem('');
        go('home');
      }
    } catch (e) {
      bridge.send('VKWebAppShowAlert', {
        message: 'Ошибка ❌'
      });
    }
  };

  const deleteRequest = async (id) => {
    await fetch(`https://test-production-7171.up.railway.app/request/${id}`, {
      method: 'DELETE'
    });
    loadRequests();
  };

  const updateStatus = async (id, status) => {
    await fetch(`https://test-production-7171.up.railway.app/request/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    loadRequests();
  };

  /* ===== CRM ===== */

  const filteredRequests = requests
    .filter((req) => {
      const text = `${req.name} ${req.contact} ${req.problem}`.toLowerCase();
      return text.includes(search.toLowerCase());
    })
    .filter((req) => {
      if (filter === 'all') return true;
      return req.status === filter;
    });

  const stats = {
    all: requests.length,
    new: requests.filter(r => r.status === 'new').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    done: requests.filter(r => r.status === 'done').length
  };

  const getStatusText = (status) => {
    if (status === 'new') return 'Новая';
    if (status === 'in_progress') return 'В работе';
    if (status === 'done') return 'Готово';
    return 'Новая';
  };

  return (
    <View activePanel={activePanel}>

      {/* HOME */}
      <Panel id="home">
        <div className="app">

          <div className="header">💻 Ремонт ПК</div>

          <div className="hero">
            <div className="heroTitle">
              👋 Привет, {user?.first_name || ''}
            </div>
            <div className="heroText">
              Оставьте заявку на ремонт
            </div>
          </div>

          <div className="card primary" onClick={() => go('form')}>
            Оставить заявку ➜
          </div>

          {isAdmin && (
            <div className="card secondary" onClick={() => go('admin')}>
              Админ панель ➜
            </div>
          )}
        </div>
      </Panel>

      {/* FORM */}
      <Panel id="form">
        <div className="formPage">

          <div className="formHeader">
            <div className="backBtn" onClick={() => go('home')}>
              ← Назад
            </div>
            <div className="formTitle">📋 Заявка</div>
          </div>

          <div className="formCard">

            <div className="inputBlock">
              <div className="label">Имя</div>
              <input className="input" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="inputBlock">
              <div className="label">Контакт</div>
              <input className="input" value={contact} onChange={e => setContact(e.target.value)} />
            </div>

            <div className="inputBlock">
              <div className="label">Проблема</div>
              <textarea className="textarea" value={problem} onChange={e => setProblem(e.target.value)} />
            </div>

            <button className="submitBtn" onClick={sendRequest}>
              Отправить
            </button>

          </div>
        </div>
      </Panel>

      {/* ADMIN */}
      <Panel id="admin">
        <div className="formPage">

          <div className="adminTop">
            <div className="backBtn" onClick={() => go('home')}>
              ← Назад
            </div>

            <input
              className="searchBar"
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div>{user?.first_name}</div>
          </div>

          {/* STATS */}
          <div className="stats">
            <div className="statCard"><div className="statNumber">{stats.all}</div><div>Все</div></div>
            <div className="statCard"><div className="statNumber">{stats.new}</div><div>Новые</div></div>
            <div className="statCard"><div className="statNumber">{stats.in_progress}</div><div>В работе</div></div>
            <div className="statCard"><div className="statNumber">{stats.done}</div><div>Готово</div></div>
          </div>

          {/* FILTERS */}
          <div className="filters">
            <div className={`filterBtn ${filter === 'all' && 'active'}`} onClick={() => setFilter('all')}>Все</div>
            <div className={`filterBtn ${filter === 'new' && 'active'}`} onClick={() => setFilter('new')}>Новые</div>
            <div className={`filterBtn ${filter === 'in_progress' && 'active'}`} onClick={() => setFilter('in_progress')}>В работе</div>
            <div className={`filterBtn ${filter === 'done' && 'active'}`} onClick={() => setFilter('done')}>Готово</div>
          </div>

          {/* TABLE */}
          <div className="table">

            <div className="row header">
              <div>Имя</div>
              <div>Контакт</div>
              <div>Проблема</div>
              <div>Статус</div>
              <div>Действия</div>
            </div>

            {filteredRequests.map((req) => (
              <div key={req.id} className="row">

                <div className="cell">{req.name}</div>
                <div className="cell">{req.contact}</div>

                {/* 🔥 КЛИК ДЛЯ ПРОСМОТРА */}
                <div className="cell link" onClick={() => setSelectedRequest(req)}>
                  {req.problem}
                </div>

                <div className={`cell status ${req.status}`}>
                  {getStatusText(req.status)}
                </div>

                <div className="cell actions">
                  <button className="actionBtn green" onClick={() => updateStatus(req.id, 'new')}>●</button>
                  <button className="actionBtn yellow" onClick={() => updateStatus(req.id, 'in_progress')}>●</button>
                  <button className="actionBtn blue" onClick={() => updateStatus(req.id, 'done')}>●</button>
                  <button className="actionBtn red" onClick={() => deleteRequest(req.id)}>✖</button>
                </div>

              </div>
            ))}

          </div>

          {/* 🔥 MODAL */}
          {selectedRequest && (
            <div className="modalOverlay" onClick={() => setSelectedRequest(null)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>

                <div className="modalTitle">📄 Заявка</div>

                <div><b>Имя:</b> {selectedRequest.name}</div>
                <div><b>Контакт:</b> {selectedRequest.contact}</div>
                <div><b>Проблема:</b></div>
                <div className="modalProblem">{selectedRequest.problem}</div>

                <button className="submitBtn" onClick={() => setSelectedRequest(null)}>
                  Закрыть
                </button>

              </div>
            </div>
          )}

        </div>
      </Panel>

    </View>
  );
}