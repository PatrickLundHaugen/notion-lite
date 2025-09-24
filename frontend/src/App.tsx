import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import PageList from './components/PageList';
import PageDetail from './components/PageDetail';
import PageForm from './components/PageForm';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Layout from './components/Layout'; 
import './App.css';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route element={<Layout />}>
                            <Route path="/" element={<PageList />} />
                            <Route path="/pages/new" element={<PageForm />} />
                            <Route path="/pages/:pageId" element={<PageDetail />} />
                        </Route>
                    </Route>
                </Routes>
            </div>
        </Router>
    );
}

export default App;