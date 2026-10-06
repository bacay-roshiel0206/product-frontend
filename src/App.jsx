import { useEffect, useState } from 'react';
import axios from 'axios';
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useNavigate
} from 'react-router-dom';
import './App.css';

const API_URL = 'https://bacay-roshiel-lavalust.onrender.com/api';

/*
|--------------------------------------------------------------------------
| Protected Route
|--------------------------------------------------------------------------
*/

function ProtectedRoute({ children }) {
    const token = localStorage.getItem('access_token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

/*
|--------------------------------------------------------------------------
| Login Page
|--------------------------------------------------------------------------
*/

function LoginPage() {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();

        setMessage('Logging in...');

        try {
            const response = await axios.post(
                `${API_URL}/auth/login`,
                {
                    username,
                    password
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Login response:', response.data);

            const accessToken = response.data.tokens?.access_token;
            const refreshToken = response.data.tokens?.refresh_token;

            if (!accessToken) {
                setMessage('Login failed. No access token received.');
                return;
            }

            localStorage.setItem(
                'access_token',
                accessToken
            );

            if (refreshToken) {
                localStorage.setItem(
                    'refresh_token',
                    refreshToken
                );
            }

            localStorage.setItem(
                'user',
                JSON.stringify(response.data.user)
            );

            setUsername('');
            setPassword('');

            navigate('/products', { replace: true });

        } catch (error) {
            console.error('Login error:', error);

            if (error.response) {
                setMessage(
                    error.response.data?.error ||
                    error.response.data?.message ||
                    'Login failed.'
                );
            } else {
                setMessage(
                    'Unable to connect to the LavaLust API.'
                );
            }
        }
    };

    return (
        <div className="login-container">

            <div className="login-card">

                <h1>
                    Product Management System
                </h1>

                <p className="subtitle">
                    Login to continue
                </p>

                <form onSubmit={handleLogin}>

                    <div className="form-group">

                        <label>
                            Username
                        </label>

                        <input
                            type="text"
                            value={username}
                            onChange={(e) =>
                                setUsername(e.target.value)
                            }
                            placeholder="Enter username"
                            required
                        />

                    </div>

                    <div className="form-group">

                        <label>
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            placeholder="Enter password"
                            required
                        />

                    </div>

                    <button type="submit">
                        Login
                    </button>

                </form>

                {message && (
                    <p className="message">
                        {message}
                    </p>
                )}

            </div>

        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Product Page
|--------------------------------------------------------------------------
*/

function ProductsPage() {

    const navigate = useNavigate();

    const [user, setUser] = useState(
        JSON.parse(
            localStorage.getItem('user') || 'null'
        )
    );

    const [message, setMessage] = useState('');

    const [products, setProducts] = useState([]);

    const [productName, setProductName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');

    const [editingId, setEditingId] = useState(null);

    /*
    |--------------------------------------------------------------------------
    | Axios configuration
    |--------------------------------------------------------------------------
    */

    const getAuthConfig = () => {

        const token =
            localStorage.getItem('access_token');

        return {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    };

    /*
    |--------------------------------------------------------------------------
    | Logout
    |--------------------------------------------------------------------------
    */

    const handleLogout = async () => {

        try {

            const refreshToken =
                localStorage.getItem('refresh_token');

            if (refreshToken) {

                await axios.post(
                    `${API_URL}/auth/logout`,
                    {
                        refresh_token: refreshToken
                    },
                    getAuthConfig()
                );

            }

        } catch (error) {

            console.error(
                'Logout error:',
                error
            );

        }

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');

        setUser(null);
        setProducts([]);

        navigate('/login', {
            replace: true
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Get Products
    |--------------------------------------------------------------------------
    */

    const fetchProducts = async () => {

        try {

            const response = await axios.get(
                `${API_URL}/products`,
                getAuthConfig()
            );

            console.log(
                'Products response:',
                response.data
            );

            setProducts(
                response.data.data || []
            );

            setMessage('');

        } catch (error) {

            console.error(
                'Fetch products error:',
                error
            );

            if (
                error.response?.status === 401
            ) {

                localStorage.removeItem(
                    'access_token'
                );

                localStorage.removeItem(
                    'refresh_token'
                );

                localStorage.removeItem(
                    'user'
                );

                navigate('/login', {
                    replace: true
                });

            } else {

                setMessage(
                    'Unable to connect to the LavaLust API.'
                );

            }
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Load products
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        fetchProducts();

    }, []);

    /*
    |--------------------------------------------------------------------------
    | Add / Update Product
    |--------------------------------------------------------------------------
    */

    const handleSubmitProduct = async (e) => {

        e.preventDefault();

        if (!productName.trim()) {

            setMessage(
                'Product name is required.'
            );

            return;
        }

        try {

            const productData = {

                product_name: productName,

                description: description,

                price: Number(price),

                quantity: Number(quantity)

            };

            if (editingId) {

                const response =
                    await axios.put(
                        `${API_URL}/products/${editingId}`,
                        productData,
                        getAuthConfig()
                    );

                console.log(
                    'Update product response:',
                    response.data
                );

                setMessage(
                    'Product updated successfully.'
                );

            } else {

                const response =
                    await axios.post(
                        `${API_URL}/products`,
                        productData,
                        getAuthConfig()
                    );

                console.log(
                    'Add product response:',
                    response.data
                );

                setMessage(
                    'Product added successfully.'
                );
            }

            clearForm();

            await fetchProducts();

        } catch (error) {

            console.error(
                editingId
                    ? 'Update product error:'
                    : 'Add product error:',
                error
            );

            if (error.response) {

                setMessage(
                    error.response.data?.error ||
                    error.response.data?.message ||
                    'Request failed.'
                );

            } else {

                setMessage(
                    'Unable to connect to the LavaLust API.'
                );

            }
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Edit Product
    |--------------------------------------------------------------------------
    */

    const handleEdit = (product) => {

        setEditingId(product.id);

        setProductName(
            product.product_name || ''
        );

        setDescription(
            product.description || ''
        );

        setPrice(
            product.price || ''
        );

        setQuantity(
            product.quantity || ''
        );

        setMessage(
            `Editing product #${product.id}`
        );

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Delete Product
    |--------------------------------------------------------------------------
    */

    const handleDelete = async (id) => {

        const confirmed =
            window.confirm(
                'Are you sure you want to delete this product?'
            );

        if (!confirmed) {
            return;
        }

        try {

            const response =
                await axios.delete(
                    `${API_URL}/products/${id}`,
                    getAuthConfig()
                );

            console.log(
                'Delete product response:',
                response.data
            );

            setMessage(
                'Product deleted successfully.'
            );

            await fetchProducts();

        } catch (error) {

            console.error(
                'Delete product error:',
                error
            );

            if (error.response) {

                setMessage(
                    error.response.data?.error ||
                    error.response.data?.message ||
                    'Failed to delete product.'
                );

            } else {

                setMessage(
                    'Unable to connect to the LavaLust API.'
                );

            }
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Clear Product Form
    |--------------------------------------------------------------------------
    */

    const clearForm = () => {

        setEditingId(null);

        setProductName('');

        setDescription('');

        setPrice('');

        setQuantity('');
    };

    /*
    |--------------------------------------------------------------------------
    | Cancel Edit
    |--------------------------------------------------------------------------
    */

    const cancelEdit = () => {

        clearForm();

        setMessage('');
    };

    /*
    |--------------------------------------------------------------------------
    | PRODUCT PAGE
    |--------------------------------------------------------------------------
    */

    return (

        <div className="container">

            <div className="header">

                <div>

                    <h1>
                        Product Management System
                    </h1>

                    <p>
                        Welcome, {user?.username}
                    </p>

                </div>

                <button
                    type="button"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </div>

            {/* ======================================================
                ADD / EDIT PRODUCT
            ====================================================== */}

            <div className="card">

                <h2>

                    {editingId
                        ? `Edit Product #${editingId}`
                        : 'Add Product'}

                </h2>

                <form
                    onSubmit={handleSubmitProduct}
                >

                    <div className="form-group">

                        <label>
                            Product Name
                        </label>

                        <input
                            type="text"
                            value={productName}
                            onChange={(e) =>
                                setProductName(
                                    e.target.value
                                )
                            }
                            placeholder="Enter product name"
                            required
                        />

                    </div>

                    <div className="form-group">

                        <label>
                            Description
                        </label>

                        <textarea
                            value={description}
                            onChange={(e) =>
                                setDescription(
                                    e.target.value
                                )
                            }
                            placeholder="Enter product description"
                            rows="4"
                        />

                    </div>

                    <div className="form-group">

                        <label>
                            Price
                        </label>

                        <input
                            type="number"
                            value={price}
                            onChange={(e) =>
                                setPrice(
                                    e.target.value
                                )
                            }
                            placeholder="Enter price"
                            min="0"
                            step="0.01"
                            required
                        />

                    </div>

                    <div className="form-group">

                        <label>
                            Quantity
                        </label>

                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) =>
                                setQuantity(
                                    e.target.value
                                )
                            }
                            placeholder="Enter quantity"
                            min="0"
                            required
                        />

                    </div>

                    <button type="submit">

                        {editingId
                            ? 'Update Product'
                            : 'Add Product'}

                    </button>

                    {editingId && (

                        <button
                            type="button"
                            onClick={cancelEdit}
                        >
                            Cancel
                        </button>

                    )}

                </form>

            </div>

            {/* ======================================================
                MESSAGE
            ====================================================== */}

            {message && (

                <p className="message">
                    {message}
                </p>

            )}

            {/* ======================================================
                PRODUCT LIST
            ====================================================== */}

            <div className="card">

                <div className="product-header">

                    <h2>
                        Product List
                    </h2>

                    <button
                        type="button"
                        onClick={fetchProducts}
                    >
                        Refresh
                    </button>

                </div>

                {products.length === 0 ? (

                    <p>
                        No products found.
                    </p>

                ) : (

                    <div className="table-container">

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        ID
                                    </th>

                                    <th>
                                        Product Name
                                    </th>

                                    <th>
                                        Description
                                    </th>

                                    <th>
                                        Price
                                    </th>

                                    <th>
                                        Quantity
                                    </th>

                                    <th>
                                        Created At
                                    </th>

                                    <th>
                                        Actions
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {products.map(
                                    (product) => (

                                    <tr
                                        key={product.id}
                                    >

                                        <td>
                                            {product.id}
                                        </td>

                                        <td>
                                            {product.product_name}
                                        </td>

                                        <td>
                                            {product.description}
                                        </td>

                                        <td>
                                            ₱
                                            {Number(
                                                product.price
                                            ).toLocaleString(
                                                'en-PH',
                                                {
                                                    minimumFractionDigits: 2
                                                }
                                            )}
                                        </td>

                                        <td>
                                            {product.quantity}
                                        </td>

                                        <td>
                                            {product.created_at}
                                        </td>

                                        <td>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleEdit(
                                                        product
                                                    )
                                                }
                                            >
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDelete(
                                                        product.id
                                                    )
                                                }
                                            >
                                                Delete
                                            </button>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>
    );
}

/*
|--------------------------------------------------------------------------
| APP ROUTER
|--------------------------------------------------------------------------
*/

function App() {

    const hasToken =
        !!localStorage.getItem('access_token');

    return (

        <BrowserRouter>

            <Routes>

                <Route
                    path="/"
                    element={
                        <Navigate
                            to={
                                hasToken
                                    ? "/products"
                                    : "/login"
                            }
                            replace
                        />
                    }
                />

                <Route
                    path="/login"
                    element={
                        hasToken
                            ? (
                                <Navigate
                                    to="/products"
                                    replace
                                />
                            )
                            : (
                                <LoginPage />
                            )
                    }
                />

                <Route
                    path="/products"
                    element={
                        <ProtectedRoute>
                            <ProductsPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;