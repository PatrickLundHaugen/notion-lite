import { Routes, Route } from 'react-router-dom';

import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/components/auth/pages/login';
import Signup from '@/components/auth/pages/signup';
import PagesFeature from '@/components/layouts/PagesLayoutProvider';
import Dashboard from '@/components/dashboard';
import Editor from '@/components/editor/Editor';

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route element={<ProtectedRoute />}>
                <Route element={<PagesFeature />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/pages/:slug" element={<Editor />} />
                </Route>
            </Route>
        </Routes>
    );
}
