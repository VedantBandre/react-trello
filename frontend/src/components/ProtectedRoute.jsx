import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import { REFRESH_TOKEN, ACCESS_TOKEN } from '../constants';
import { useState, useEffect } from 'react';

function ProtectedRoute({children}) {
    const [isAuthorized, setIsAuthorized] = useState(null);

    // Triggers authentication process as soon as the component is rendered
    // Ensure that app doesn't render protected content until user is authenticated
    useEffect(() => {
        auth().catch(() => setIsAuthorized(false))
    }, []);

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN)
        try {
            // send a post request to token refresh api with the refresh token attached
            // and store the response in res
            const res = await api.post('/api/token/refresh/', {
                refresh: refreshToken,
            });

            // if response was successful, set access token value in localStorage
            if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                setIsAuthorized(true);
            } else {
                setIsAuthorized(false); // for unsuccessful requests
            }

        } catch (error) {
            console.log(error);
            setIsAuthorized(false);
        }
    }

    const auth = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        
        // check if access token exists
        if (!token) {
            setIsAuthorized(false);
            return;
        }

        // as token exists, decode to get expiration date in seconds
        const decoded = jwtDecode(token);
        const tokenExpiration = decoded.exp;
        
        // get current date in seconds
        const now = Date.now() /1000;

        // if token expired, await for refresh token, else query must have access token
        if (tokenExpiration < now)
            await refreshToken();
        else
            setIsAuthorized(true);

    }

    if (isAuthorized === null) {
        return <div>Loading...</div>;
    }

    // if authorized : pass to children : else redirect user to login page
    return isAuthorized ? children : <Navigate to ='/login' />;
}

export default ProtectedRoute;