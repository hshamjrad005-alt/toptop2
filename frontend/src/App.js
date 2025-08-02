import React, { useState, useEffect } from 'react';
import './App.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { Alert, AlertDescription } from './components/ui/alert';
import { Separator } from './components/ui/separator';
import { GamepadIcon, ShoppingCartIcon, StarIcon, PhoneIcon, MailIcon, UserIcon, LockIcon, PlusIcon, EditIcon, TrashIcon, LogOutIcon, UserPlusIcon, UserCheckIcon } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export default function App() {
  const [games, setGames] = useState([]);
  const [news, setNews] = useState([]);
  const [banners, setBanners] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [orderForm, setOrderForm] = useState({
    player_id: '',
    customer_name: '',
    customer_phone: '',
    customer_email: ''
  });
  const [loading, setLoading] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(0);
  
  // Admin states
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState(localStorage.getItem('admin_token'));
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });
  const [adminData, setAdminData] = useState({ games: [], news: [], banners: [], orders: [] });
  const [showAdminForm, setShowAdminForm] = useState({ type: '', show: false, data: null });
  
  // User states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userToken, setUserToken] = useState(localStorage.getItem('user_token'));
  const [currentUser, setCurrentUser] = useState(null);
  const [showUserAuth, setShowUserAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [showUserDashboard, setShowUserDashboard] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone: ''
  });
  const [userOrders, setUserOrders] = useState([]);

  useEffect(() => {
    fetchData();
    // Banner carousel
    const interval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    if (adminToken) {
      setIsAdmin(true);
      fetchAdminData();
    }
  }, [adminToken]);

  useEffect(() => {
    if (userToken) {
      setIsLoggedIn(true);
      fetchUserProfile();
    }
  }, [userToken]);

  const fetchData = async () => {
    try {
      const [gamesRes, newsRes, bannersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/games`),
        fetch(`${API_BASE_URL}/api/news`),
        fetch(`${API_BASE_URL}/api/banners`)
      ]);
      
      const gamesData = await gamesRes.json();
      const newsData = await newsRes.json();
      const bannersData = await bannersRes.json();
      
      setGames(gamesData.games || []);
      setNews(newsData.news || []);
      setBanners(bannersData.banners || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchAdminData = async () => {
    if (!adminToken) return;
    
    try {
      const headers = { 'Authorization': `Bearer ${adminToken}` };
      const [gamesRes, newsRes, bannersRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/games`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/news`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/banners`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/orders`, { headers })
      ]);
      
      const gamesData = await gamesRes.json();
      const newsData = await newsRes.json();
      const bannersData = await bannersRes.json();
      const ordersData = await ordersRes.json();
      
      setAdminData({
        games: gamesData.games || [],
        news: newsData.news || [],
        banners: bannersData.banners || [],
        orders: ordersData.orders || []
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const fetchUserProfile = async () => {
    if (!userToken) return;
    
    try {
      const headers = { 'Authorization': `Bearer ${userToken}` };
      const response = await fetch(`${API_BASE_URL}/api/users/me`, { headers });
      
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      } else {
        // Token might be invalid
        handleUserLogout();
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      handleUserLogout();
    }
  };

  const fetchUserOrders = async () => {
    if (!userToken) return;
    
    try {
      const headers = { 'Authorization': `Bearer ${userToken}` };
      const response = await fetch(`${API_BASE_URL}/api/users/orders`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setUserOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching user orders:', error);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAdminToken(data.token);
        localStorage.setItem('admin_token', data.token);
        setIsAdmin(true);
        setShowAdminLogin(false);
        setAdminForm({ username: '', password: '' });
      } else {
        alert('بيانات الدخول غير صحيحة');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setAdminToken(null);
    localStorage.removeItem('admin_token');
  };

  const handleUserLogout = () => {
    setIsLoggedIn(false);
    setUserToken(null);
    setCurrentUser(null);
    setUserOrders([]);
    localStorage.removeItem('user_token');
    setShowUserDashboard(false);
  };

  const handleUserAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const endpoint = authMode === 'login' ? '/api/users/login' : '/api/users/register';
      const payload = authMode === 'login' 
        ? { username: userForm.username, password: userForm.password }
        : userForm;
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUserToken(data.access_token);
        localStorage.setItem('user_token', data.access_token);
        setIsLoggedIn(true);
        setShowUserAuth(false);
        setUserForm({ username: '', email: '', password: '', full_name: '', phone: '' });
        
        const successMessage = authMode === 'login' 
          ? 'تم تسجيل الدخول بنجاح!' 
          : 'تم إنشاء الحساب بنجاح!';
        alert(successMessage);
      } else {
        const errorMessage = authMode === 'login'
          ? 'خطأ في بيانات الدخول'
          : data.detail || 'خطأ في إنشاء الحساب';
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('حدث خطأ في العملية');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (game, packageInfo) => {
    setSelectedGame(game);
    setSelectedPackage(packageInfo);
    
    // Pre-fill form if user is logged in
    if (isLoggedIn && currentUser) {
      setOrderForm({
        ...orderForm,
        customer_name: currentUser.full_name,
        customer_phone: currentUser.phone || '',
        customer_email: currentUser.email
      });
    }
    
    setShowOrderDialog(true);
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const orderData = {
        game_id: selectedGame.id,
        game_name: selectedGame.name_ar,
        player_id: orderForm.player_id,
        amount: selectedPackage.amount,
        price: selectedPackage.price,
        currency: selectedPackage.currency,
        customer_name: orderForm.customer_name,
        customer_phone: orderForm.customer_phone,
        customer_email: orderForm.customer_email
      };
      
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Open WhatsApp with the order details
        window.open(data.whatsapp_url, '_blank');
        setShowOrderDialog(false);
        setOrderForm({ player_id: '', customer_name: '', customer_phone: '', customer_email: '' });
        alert('تم إرسال طلبك بنجاح! سيتم توجيهك للواتساب لإكمال الطلب');
      } else {
        alert('حدث خطأ في إرسال الطلب');
      }
    } catch (error) {
      console.error('Order error:', error);
      alert('حدث خطأ في إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAction = async (action, type, id = null, data = null) => {
    const headers = { 
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };
    
    try {
      let url = `${API_BASE_URL}/api/admin/${type}`;
      let method = 'GET';
      let body = null;
      
      if (action === 'create') {
        method = 'POST';
        body = JSON.stringify(data);
      } else if (action === 'update') {
        url += `/${id}`;
        method = 'PUT';
        body = JSON.stringify(data);
      } else if (action === 'delete') {
        url += `/${id}`;
        method = 'DELETE';
      }
      
      const response = await fetch(url, { method, headers, body });
      
      if (response.ok) {
        fetchAdminData();
        fetchData(); // Refresh public data too
        setShowAdminForm({ type: '', show: false, data: null });
        alert('تم تنفيذ العملية بنجاح');
      } else {
        alert('حدث خطأ في تنفيذ العملية');
      }
    } catch (error) {
      console.error('Admin action error:', error);
      alert('حدث خطأ في تنفيذ العملية');
    }
  };

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white">
        <div className="container mx-auto px-4 py-8" dir="rtl">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">لوحة الإدارة</h1>
            <Button onClick={handleLogout} variant="outline" className="text-white border-white hover:bg-white hover:text-gray-900">
              <LogOutIcon className="w-4 h-4 ml-2" />
              تسجيل خروج
            </Button>
          </div>

          <Tabs defaultValue="games" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="games">الألعاب</TabsTrigger>
              <TabsTrigger value="news">الأخبار</TabsTrigger>
              <TabsTrigger value="banners">البانرات</TabsTrigger>
              <TabsTrigger value="orders">الطلبات</TabsTrigger>
            </TabsList>

            <TabsContent value="games">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">إدارة الألعاب</h2>
                <Button onClick={() => setShowAdminForm({ type: 'games', show: true, data: null })}>
                  <PlusIcon className="w-4 h-4 ml-2" />
                  إضافة لعبة
                </Button>
              </div>
              <div className="grid gap-4">
                {adminData.games.map(game => (
                  <Card key={game.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                          <img src={game.image_url} alt={game.name_ar} className="w-16 h-16 object-cover rounded" />
                          <div>
                            <h3 className="font-bold text-lg">{game.name_ar}</h3>
                            <p className="text-gray-400">{game.description_ar}</p>
                            <Badge variant={game.is_active ? "default" : "secondary"}>
                              {game.is_active ? "نشط" : "غير نشط"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => setShowAdminForm({ type: 'games', show: true, data: game })}>
                            <EditIcon className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleAdminAction('delete', 'games', game.id)}>
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="news">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">إدارة الأخبار</h2>
                <Button onClick={() => setShowAdminForm({ type: 'news', show: true, data: null })}>
                  <PlusIcon className="w-4 h-4 ml-2" />
                  إضافة خبر
                </Button>
              </div>
              <div className="grid gap-4">
                {adminData.news.map(item => (
                  <Card key={item.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">{item.title_ar}</h3>
                          <p className="text-gray-400">{item.content_ar}</p>
                          <Badge variant={item.is_active ? "default" : "secondary"}>
                            {item.is_active ? "نشط" : "غير نشط"}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => setShowAdminForm({ type: 'news', show: true, data: item })}>
                            <EditIcon className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleAdminAction('delete', 'news', item.id)}>
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="banners">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">إدارة البانرات</h2>
                <Button onClick={() => setShowAdminForm({ type: 'banners', show: true, data: null })}>
                  <PlusIcon className="w-4 h-4 ml-2" />
                  إضافة بانر
                </Button>
              </div>
              <div className="grid gap-4">
                {adminData.banners.map(banner => (
                  <Card key={banner.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                          <img src={banner.image_url} alt={banner.title_ar} className="w-24 h-16 object-cover rounded" />
                          <div>
                            <h3 className="font-bold text-lg">{banner.title_ar}</h3>
                            <p className="text-gray-400">{banner.link}</p>
                            <Badge variant={banner.is_active ? "default" : "secondary"}>
                              {banner.is_active ? "نشط" : "غير نشط"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => setShowAdminForm({ type: 'banners', show: true, data: banner })}>
                            <EditIcon className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleAdminAction('delete', 'banners', banner.id)}>
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="orders">
              <h2 className="text-2xl font-bold mb-6">الطلبات</h2>
              <div className="grid gap-4">
                {adminData.orders.map(order => (
                  <Card key={order.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-400">اللعبة</p>
                          <p className="font-semibold">{order.game_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">آي دي اللاعب</p>
                          <p className="font-semibold">{order.player_id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">الكمية والسعر</p>
                          <p className="font-semibold">{order.amount} - {order.price} {order.currency}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">العميل</p>
                          <p className="font-semibold">{order.customer_name}</p>
                          <p className="text-sm text-gray-400">{order.customer_phone}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Admin Forms */}
        {showAdminForm.show && (
          <AdminFormModal 
            type={showAdminForm.type}
            data={showAdminForm.data}
            onClose={() => setShowAdminForm({ type: '', show: false, data: null })}
            onSubmit={(data) => handleAdminAction(showAdminForm.data ? 'update' : 'create', showAdminForm.type, showAdminForm.data?.id, data)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white" dir="rtl">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <GamepadIcon className="w-8 h-8 text-purple-400" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                متجر الألعاب 2025
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              {isLoggedIn && currentUser ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowUserDashboard(true)}
                    className="text-white border-gray-600 hover:bg-gray-800"
                  >
                    <UserCheckIcon className="w-4 h-4 ml-2" />
                    {currentUser.full_name}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleUserLogout}
                    className="text-white border-gray-600 hover:bg-gray-800"
                  >
                    <LogOutIcon className="w-4 h-4 ml-2" />
                    خروج
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => setShowUserAuth(true)}
                  className="text-white border-gray-600 hover:bg-gray-800"
                >
                  <UserPlusIcon className="w-4 h-4 ml-2" />
                  دخول / تسجيل
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => setShowAdminLogin(true)}
                className="text-white border-gray-600 hover:bg-gray-800"
              >
                <UserIcon className="w-4 h-4 ml-2" />
                دخول الإدارة
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Login Modal */}
      {showAdminLogin && !isAdmin && (
        <Dialog open={showAdminLogin && !isAdmin} onOpenChange={setShowAdminLogin}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>دخول الإدارة</DialogTitle>
              <DialogDescription>
                أدخل بيانات الدخول للوصول للوحة الإدارة
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <Label>اسم المستخدم</Label>
                <Input
                  type="text"
                  value={adminForm.username}
                  onChange={(e) => setAdminForm({...adminForm, username: e.target.value})}
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
              </div>
              <div>
                <Label>كلمة المرور</Label>
                <Input
                  type="password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'جاري تسجيل الدخول...' : 'دخول'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAdminLogin(false)}>
                  عودة للموقع
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* User Auth Modal */}
      {showUserAuth && (
        <Dialog open={showUserAuth} onOpenChange={setShowUserAuth}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>
                {authMode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
              </DialogTitle>
              <DialogDescription>
                {authMode === 'login' 
                  ? 'أدخل بيانات حسابك للدخول'
                  : 'أنشئ حساباً جديداً للاستفادة من المزايا'
                }
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={authMode} onValueChange={setAuthMode} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">دخول</TabsTrigger>
                <TabsTrigger value="register">تسجيل</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleUserAuth} className="space-y-4">
                  <div>
                    <Label>اسم المستخدم</Label>
                    <Input
                      type="text"
                      value={userForm.username}
                      onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label>كلمة المرور</Label>
                    <Input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? 'جاري تسجيل الدخول...' : 'دخول'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowUserAuth(false)}>
                      إلغاء
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleUserAuth} className="space-y-4">
                  <div>
                    <Label>اسم المستخدم *</Label>
                    <Input
                      type="text"
                      value={userForm.username}
                      onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label>البريد الإلكتروني *</Label>
                    <Input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label>الاسم الكامل *</Label>
                    <Input
                      type="text"
                      value={userForm.full_name}
                      onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label>رقم الهاتف</Label>
                    <Input
                      type="tel"
                      value={userForm.phone}
                      onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label>كلمة المرور *</Label>
                    <Input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowUserAuth(false)}>
                      إلغاء
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* News Ticker */}
      <div className="bg-purple-600/20 border-y border-purple-500/30 py-2 overflow-hidden">
        <div className="animate-scroll whitespace-nowrap">
          <span className="inline-flex items-center gap-8 text-sm">
            {news.map((item, index) => (
              <span key={index} className="flex items-center gap-2">
                <StarIcon className="w-4 h-4 text-yellow-400" />
                {item.content_ar}
              </span>
            ))}
          </span>
        </div>
      </div>

      {/* Hero Banner Carousel */}
      {banners.length > 0 && (
        <section className="relative h-96 overflow-hidden">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-transform duration-1000 ease-in-out ${
                index === currentBanner ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              <div
                className="w-full h-full bg-cover bg-center relative"
                style={{ backgroundImage: `url(${banner.image_url})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent">
                  <div className="container mx-auto px-4 h-full flex items-center">
                    <div className="text-right max-w-lg">
                      <h2 className="text-4xl font-bold mb-4 text-white drop-shadow-lg">
                        {banner.title_ar}
                      </h2>
                      <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                        اكتشف الألعاب
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Banner Indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentBanner(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentBanner ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Games Section */}
      <section className="container mx-auto px-4 py-16" id="games">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            الألعاب المتاحة
          </h2>
          <p className="text-gray-400 text-lg">اختر لعبتك المفضلة واحصل على الشحن فوراً</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.map(game => (
            <Card key={game.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <img
                  src={game.image_url}
                  alt={game.name_ar}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <CardTitle className="text-xl text-right">{game.name_ar}</CardTitle>
                <CardDescription className="text-gray-400 text-right">
                  {game.description_ar}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {game.prices.map((pkg, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                      <div className="text-right">
                        <p className="font-semibold">{pkg.amount}</p>
                        <p className="text-sm text-gray-400">{pkg.price} {pkg.currency}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handlePurchase(game, pkg)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        <ShoppingCartIcon className="w-4 h-4 ml-2" />
                        شراء
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/30 border-t border-gray-700 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center md:text-right">
            <div>
              <h3 className="text-xl font-bold mb-4 text-purple-400">اتصل بنا</h3>
              <div className="space-y-2 text-gray-400">
                <p className="flex items-center justify-center md:justify-start gap-2">
                  <PhoneIcon className="w-4 h-4" />
                  +967777826667
                </p>
                <p className="flex items-center justify-center md:justify-start gap-2">
                  <MailIcon className="w-4 h-4" />
                  support@gamingstore2025.com
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 text-purple-400">الخدمات</h3>
              <div className="space-y-2 text-gray-400">
                <p>شحن فوري</p>
                <p>دعم على مدار الساعة</p>
                <p>أسعار منافسة</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 text-purple-400">حول الموقع</h3>
              <p className="text-gray-400">
                متجر الألعاب 2025 - وجهتك الأولى لشحن الألعاب والتطبيقات
              </p>
            </div>
          </div>
          <Separator className="my-8 bg-gray-700" />
          <div className="text-center text-gray-400">
            <p>© 2025 متجر الألعاب. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>

      {/* Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">إتمام الطلب</DialogTitle>
            <DialogDescription className="text-right text-gray-400">
              أدخل بياناتك لإتمام عملية الشحن
            </DialogDescription>
          </DialogHeader>
          
          {selectedGame && selectedPackage && (
            <div className="bg-gray-800/50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-purple-400 mb-2">{selectedGame.name_ar}</h3>
              <div className="flex justify-between text-sm">
                <span>الكمية: {selectedPackage.amount}</span>
                <span>السعر: {selectedPackage.price} {selectedPackage.currency}</span>
              </div>
              {isLoggedIn && currentUser && (
                <p className="text-xs text-green-400 mt-2">
                  ✓ تم ملء البيانات تلقائياً من حسابك
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleOrderSubmit} className="space-y-4">
            <div>
              <Label className="text-right block mb-2">آي دي اللاعب *</Label>
              <Input
                type="text"
                value={orderForm.player_id}
                onChange={(e) => setOrderForm({...orderForm, player_id: e.target.value})}
                className="bg-gray-800 border-gray-600 text-white text-right"
                placeholder="أدخل آي دي اللاعب"
                required
              />
            </div>
            
            <div>
              <Label className="text-right block mb-2">الاسم الكامل *</Label>
              <Input
                type="text"
                value={orderForm.customer_name}
                onChange={(e) => setOrderForm({...orderForm, customer_name: e.target.value})}
                className="bg-gray-800 border-gray-600 text-white text-right"
                placeholder="أدخل اسمك الكامل"
                required
              />
            </div>
            
            <div>
              <Label className="text-right block mb-2">رقم الهاتف *</Label>
              <Input
                type="tel"
                value={orderForm.customer_phone}
                onChange={(e) => setOrderForm({...orderForm, customer_phone: e.target.value})}
                className="bg-gray-800 border-gray-600 text-white text-right"
                placeholder="أدخل رقم هاتفك"
                required
              />
            </div>
            
            <div>
              <Label className="text-right block mb-2">البريد الإلكتروني (اختياري)</Label>
              <Input
                type="email"
                value={orderForm.customer_email}
                onChange={(e) => setOrderForm({...orderForm, customer_email: e.target.value})}
                className="bg-gray-800 border-gray-600 text-white text-right"
                placeholder="أدخل بريدك الإلكتروني"
              />
            </div>

            <Alert className="border-purple-500/50 bg-purple-500/10">
              <AlertDescription className="text-right text-purple-200">
                سيتم توجيهك للواتساب لإرسال تفاصيل الطلب وإتمام الدفع
              </AlertDescription>
            </Alert>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowOrderDialog(false)}
                className="flex-1 border-gray-600 text-white hover:bg-gray-800"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {loading ? 'جاري الإرسال...' : 'إرسال للواتساب'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* User Dashboard */}
      {showUserDashboard && currentUser && (
        <Dialog open={showUserDashboard} onOpenChange={setShowUserDashboard}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-right">لوحة تحكم المستخدم</DialogTitle>
              <DialogDescription className="text-right">
                إدارة حسابك ومراجعة طلباتك
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
                <TabsTrigger value="orders" onClick={fetchUserOrders}>طلباتي</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="space-y-4">
                <div className="bg-gray-800/50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-4 text-purple-400">المعلومات الشخصية</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>اسم المستخدم</Label>
                      <Input
                        value={currentUser.username}
                        disabled
                        className="bg-gray-700 border-gray-600 text-gray-400"
                      />
                    </div>
                    <div>
                      <Label>الاسم الكامل</Label>
                      <Input
                        value={currentUser.full_name}
                        disabled
                        className="bg-gray-700 border-gray-600 text-gray-400"
                      />
                    </div>
                    <div>
                      <Label>البريد الإلكتروني</Label>
                      <Input
                        value={currentUser.email}
                        disabled
                        className="bg-gray-700 border-gray-600 text-gray-400"
                      />
                    </div>
                    <div>
                      <Label>رقم الهاتف</Label>
                      <Input
                        value={currentUser.phone || 'غير محدد'}
                        disabled
                        className="bg-gray-700 border-gray-600 text-gray-400"
                      />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-400">
                    <p>تاريخ التسجيل: {new Date(currentUser.created_at).toLocaleDateString('ar-SA')}</p>
                    {currentUser.last_login && (
                      <p>آخر دخول: {new Date(currentUser.last_login).toLocaleDateString('ar-SA')}</p>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="orders">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-purple-400">طلباتي ({userOrders.length})</h3>
                  {userOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <ShoppingCartIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>لا توجد طلبات حتى الآن</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {userOrders.map(order => (
                        <Card key={order.id} className="bg-gray-800 border-gray-700">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-sm text-gray-400">اللعبة</p>
                                <p className="font-semibold">{order.game_name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400">آي دي اللاعب</p>
                                <p className="font-semibold">{order.player_id}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400">الكمية والسعر</p>
                                <p className="font-semibold">{order.amount} - {order.price} {order.currency}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400">التاريخ</p>
                                <p className="font-semibold">{new Date(order.created_at).toLocaleDateString('ar-SA')}</p>
                                <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                                  {order.status === 'pending' ? 'معلق' : 'مكتمل'}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Admin Form Modal Component
function AdminFormModal({ type, data, onClose, onSubmit }) {
  const [formData, setFormData] = useState(
    data || (type === 'games' ? {
      name: '', name_ar: '', description: '', description_ar: '',
      image_url: '', prices: [{ amount: '', price: '', currency: 'ريال' }], is_active: true
    } : type === 'news' ? {
      title: '', title_ar: '', content: '', content_ar: '', is_active: true
    } : {
      title: '', title_ar: '', image_url: '', link: '', is_active: true
    })
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addPrice = () => {
    setFormData({
      ...formData,
      prices: [...formData.prices, { amount: '', price: '', currency: 'ريال' }]
    });
  };

  const updatePrice = (index, field, value) => {
    const newPrices = [...formData.prices];
    newPrices[index][field] = value;
    setFormData({ ...formData, prices: newPrices });
  };

  const removePrice = (index) => {
    setFormData({
      ...formData,
      prices: formData.prices.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">
            {data ? 'تعديل' : 'إضافة'} {type === 'games' ? 'لعبة' : type === 'news' ? 'خبر' : 'بانر'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'games' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الاسم بالعربية</Label>
                  <Input
                    value={formData.name_ar}
                    onChange={(e) => setFormData({...formData, name_ar: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white"
                    required
                  />
                </div>
                <div>
                  <Label>الاسم بالإنجليزية</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الوصف بالعربية</Label>
                  <Input
                    value={formData.description_ar}
                    onChange={(e) => setFormData({...formData, description_ar: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white"
                    required
                  />
                </div>
                <div>
                  <Label>الوصف بالإنجليزية</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label>رابط الصورة</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>الأسعار</Label>
                  <Button type="button" size="sm" onClick={addPrice}>
                    <PlusIcon className="w-4 h-4" />
                  </Button>
                </div>
                {formData.prices.map((price, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                    <Input
                      placeholder="الكمية"
                      value={price.amount}
                      onChange={(e) => updatePrice(index, 'amount', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                    <Input
                      placeholder="السعر"
                      value={price.price}
                      onChange={(e) => updatePrice(index, 'price', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                    <Input
                      placeholder="العملة"
                      value={price.currency}
                      onChange={(e) => updatePrice(index, 'currency', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                    <Button type="button" size="sm" variant="destructive" onClick={() => removePrice(index)}>
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {type === 'news' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>العنوان بالعربية</Label>
                  <Input
                    value={formData.title_ar}
                    onChange={(e) => setFormData({...formData, title_ar: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white"
                    required
                  />
                </div>
                <div>
                  <Label>العنوان بالإنجليزية</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>المحتوى بالعربية</Label>
                  <Input
                    value={formData.content_ar}
                    onChange={(e) => setFormData({...formData, content_ar: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white"
                    required
                  />
                </div>
                <div>
                  <Label>المحتوى بالإنجليزية</Label>
                  <Input
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white"
                    required
                  />
                </div>
              </div>
            </>
          )}
          
          {type === 'banners' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>العنوان بالعربية</Label>
                  <Input
                    value={formData.title_ar}
                    onChange={(e) => setFormData({...formData, title_ar: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white"
                    required
                  />
                </div>
                <div>
                  <Label>العنوان بالإنجليزية</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label>رابط الصورة</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
              </div>
              
              <div>
                <Label>الرابط (اختياري)</Label>
                <Input
                  value={formData.link}
                  onChange={(e) => setFormData({...formData, link: e.target.value})}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </>
          )}
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
            />
            <Label>نشط</Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              إلغاء
            </Button>
            <Button type="submit" className="flex-1">
              {data ? 'تحديث' : 'إضافة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}