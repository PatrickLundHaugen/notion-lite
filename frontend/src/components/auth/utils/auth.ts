export const auth = {
    getToken: (): string | null => {
        return localStorage.getItem('authToken');
    },
    setToken: (token: string): void => {
        localStorage.setItem('authToken', token);
    },
    logout: (): void => {
        localStorage.removeItem('authToken');
    }
}