import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Gift, Users, LogOut, Plus, Trash2, Check, X, Bell, Settings, Upload, Link as LinkIcon } from 'lucide-react';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ybbsjuhrdxjdtbzwoive.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliYnNqdWhyZHhqZHRiendvaXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTMxNjUsImV4cCI6MjA4NTk2OTE2NX0.vJmH36FLWo7nzvLc2eI-vPWsS7JXR7Hn_yUxhbEn5Ak';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Main App Component
export default function PajeDigital() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('login');
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [gifts, setGifts] = useState([]);
  const [members, setMembers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const previousUnreadCount = useRef(0);
  const [countdown, setCountdown] = useState({ months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isIOSSafari, setIsIOSSafari] = useState(false);

  // Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [authError, setAuthError] = useState('');

  // Gift form states
  const [showGiftForm, setShowGiftForm] = useState(false);
  const [giftName, setGiftName] = useState('');
  const [giftDescription, setGiftDescription] = useState('');
  const [giftUrl, setGiftUrl] = useState('');
  const [giftImage, setGiftImage] = useState(null);

  // Group form states
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    checkUser();
    
    // Detect iOS Safari
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua);
    const webkit = /WebKit/.test(ua);
    const iOSSafari = iOS && webkit && !/CriOS|FxiOS|OPiOS|mercury/.test(ua);
    setIsIOSSafari(iOSSafari);
    
    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      // On iOS Safari, check if notification API is actually available
      if (iOSSafari && !('Notification' in window && Notification.requestPermission)) {
        setNotificationPermission('unsupported');
      }
    } else {
      setNotificationPermission('unsupported');
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupData();
      loadNotifications();
      
      // Poll for new notifications every 10 seconds
      const interval = setInterval(loadNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedGroup]);

  // Countdown to Reyes Magos
  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      
      // Determine target year: if we're between Jan 1-5, target is this year; otherwise next year
      let targetYear = currentYear;
      if (now.getMonth() === 0 && now.getDate() <= 5) {
        targetYear = currentYear;
      } else if (now.getMonth() > 0 || now.getDate() > 5) {
        targetYear = currentYear + 1;
      }
      
      const reyesDate = new Date(targetYear, 0, 6, 0, 0, 0); // Jan 6 at 00:00:00
      const diff = reyesDate - now;
      
      if (diff > 0) {
        const seconds = Math.floor((diff / 1000) % 60);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        // Calculate months (approximate)
        const months = Math.floor(days / 30);
        const remainingDays = days % 30;
        
        setCountdown({ months, days: remainingDays, hours, minutes, seconds });
      } else {
        setCountdown({ months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };
    
    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username
        }
      }
    });

    if (error) {
      // Humanize error messages in Spanish
      let friendlyError = 'Ups, algo salió mal. ¿Puedes intentarlo de nuevo?';
      
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        friendlyError = 'Este email ya está registrado. ¿Quieres iniciar sesión?';
      } else if (error.message.includes('invalid email')) {
        friendlyError = 'Este email no parece válido. Revísalo porfa.';
      } else if (error.message.includes('password')) {
        friendlyError = 'La contraseña debe tener al menos 6 caracteres.';
      }
      
      setAuthError(friendlyError);
    } else {
      // Create user profile
      await supabase.from('profiles').insert([
        { id: data.user.id, username: username, email: email }
      ]);
      setUser(data.user);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Humanize error messages in Spanish
      let friendlyError = 'Mmm, parece que algo no cuadra.';
      
      if (error.message.includes('Invalid login credentials') || error.message.includes('invalid') || error.message.includes('incorrect')) {
        friendlyError = 'Email o contraseña incorrectos. ¿Los revisas?';
      } else if (error.message.includes('Email not confirmed')) {
        friendlyError = 'Necesitas confirmar tu email primero. Revisa tu bandeja de entrada.';
      } else if (error.message.includes('not found')) {
        friendlyError = 'No encuentro ese email. ¿Seguro que te registraste?';
      }
      
      setAuthError(friendlyError);
    } else {
      setUser(data.user);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSelectedGroup(null);
    setGroups([]);
  };

  const loadGroups = async () => {
    // Get groups where user is a member
    const { data: memberData } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);

    if (memberData && memberData.length > 0) {
      const groupIds = memberData.map(m => m.group_id);
      const { data: groupsData } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);
      
      setGroups(groupsData || []);
    }
  };

  const loadGroupData = async () => {
    // Load gifts
    const { data: giftsData } = await supabase
      .from('gifts')
      .select(`
        *,
        user:profiles(username),
        reservations:gift_reservations(user_id, reserved_by:profiles(username))
      `)
      .eq('group_id', selectedGroup.id)
      .order('created_at', { ascending: false });

    setGifts(giftsData || []);

    // Load members
    const { data: membersData } = await supabase
      .from('group_members')
      .select('user_id, user:profiles(username, email), role')
      .eq('group_id', selectedGroup.id);

    setMembers(membersData || []);
  };

  const loadNotifications = async () => {
    if (!user || !selectedGroup) return;
    
    const { data: notifData } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('group_id', selectedGroup.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (notifData) {
      // Check if there are new unread notifications
      const newUnreadCount = notifData.filter(n => !n.read).length;
      
      setNotifications(notifData);
      setUnreadCount(newUnreadCount);
      
      // If there's a new notification (count increased)
      if (newUnreadCount > previousUnreadCount.current) {
        playNotificationSound();
        
        // Show browser notification if permitted
        if (notificationPermission === 'granted') {
          const latestNotif = notifData.find(n => !n.read);
          if (latestNotif) {
            new Notification('🎁 Paje Digital', {
              body: latestNotif.message,
              icon: '/gift.svg',
              badge: '/gift.svg',
              tag: 'paje-digital'
            });
          }
        }
        
        // Reload gifts to show updates
        loadGroupData();
      }
      
      // Update the ref for next comparison
      previousUnreadCount.current = newUnreadCount;
    }
  };

  const playNotificationSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Uy, tu navegador no puede mostrar notificaciones 😕\n\nPrueba con Chrome, Firefox o Safari actualizado.');
      return;
    }
    
    if (Notification.permission === 'denied') {
      alert('Tienes las notificaciones bloqueadas.\n\nSi quieres activarlas, ve a la configuración de tu navegador y permítelas para esta página.');
      return;
    }
    
    if (Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === 'granted') {
          new Notification('🎁 Paje Digital', {
            body: '¡Genial! Te avisaremos cuando haya novedades en la familia.',
            icon: '/gift.svg'
          });
        } else if (permission === 'denied') {
          alert('Vale, sin problema. Si cambias de opinión, puedes activarlas desde la configuración del navegador.');
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        alert('Mmm, algo falló al activar las notificaciones.\n\n¿Estás usando HTTPS? Si no, prueba con Chrome o Firefox.');
      }
    }
  };

  const markNotificationsAsRead = async () => {
    if (notifications.length === 0) return;
    
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);
      
      setUnreadCount(0);
      loadNotifications();
    }
  };

  const generateInviteCode = () => {
    // Generate a unique 8-character code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars like O,0,I,1
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const createGroup = async (e) => {
    e.preventDefault();
    
    const inviteCode = generateInviteCode();
    
    const { data: groupData, error } = await supabase
      .from('groups')
      .insert([{ name: groupName, admin_id: user.id, invite_code: inviteCode }])
      .select()
      .single();

    if (error) {
      // If error is duplicate invite code, try again
      if (error.code === '23505') {
        createGroup(e);
        return;
      }
      console.error('Error creating group:', error);
      alert('Vaya, no pude crear la familia 😕\n\n¿Puedes intentarlo otra vez?');
      return;
    }

    if (groupData) {
      // Add creator as admin member
      await supabase.from('group_members').insert([
        { group_id: groupData.id, user_id: user.id, role: 'admin' }
      ]);
      
      setShowGroupForm(false);
      setGroupName('');
      loadGroups();
    }
  };

  const joinGroup = async (e) => {
    e.preventDefault();
    
    // Find group by invite code
    const { data: groupData } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();

    if (groupData) {
      // Check if already a member
      const { data: existing } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupData.id)
        .eq('user_id', user.id)
        .single();

      if (!existing) {
        await supabase.from('group_members').insert([
          { group_id: groupData.id, user_id: user.id, role: 'member' }
        ]);
        setInviteCode('');
        loadGroups();
      }
    }
  };

  const createGift = async (e) => {
    e.preventDefault();
    
    let imageUrl = null;
    
    // Upload image if provided
    if (giftImage) {
      const fileExt = giftImage.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gift-images')
        .upload(fileName, giftImage);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('gift-images')
          .getPublicUrl(fileName);
        imageUrl = publicUrl;
      }
    }

    await supabase.from('gifts').insert([{
      group_id: selectedGroup.id,
      user_id: user.id,
      name: giftName,
      description: giftDescription,
      url: giftUrl,
      image_url: imageUrl
    }]);

    setShowGiftForm(false);
    setGiftName('');
    setGiftDescription('');
    setGiftUrl('');
    setGiftImage(null);
    loadGroupData();
  };

  const toggleReservation = async (giftId, isReserved) => {
    if (isReserved) {
      // Remove reservation
      await supabase
        .from('gift_reservations')
        .delete()
        .eq('gift_id', giftId)
        .eq('user_id', user.id);
    } else {
      // Add reservation
      await supabase
        .from('gift_reservations')
        .insert([{ gift_id: giftId, user_id: user.id }]);
    }
    
    loadGroupData();
  };

  const deleteGift = async (giftId, giftName) => {
    // Only admins can delete gifts
    const isAdmin = selectedGroup.admin_id === user.id;
    
    if (!isAdmin) {
      alert('Solo el admin de la familia puede borrar regalos 🔒\n\nSi necesitas eliminar este regalo, pídele al admin que lo haga por ti.');
      return;
    }
    
    if (!confirm(`¿Seguro que quieres borrar "${giftName}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }
    
    // Delete gift (reservations will be deleted automatically via CASCADE)
    await supabase.from('gifts').delete().eq('id', giftId);
    loadGroupData();
  };

  const deleteGroup = async () => {
    // Only admin can delete the group
    if (selectedGroup.admin_id !== user.id) {
      alert('Solo el admin puede eliminar la familia.');
      return;
    }
    
    if (!confirm(`⚠️ ¿Estás seguro de eliminar "${selectedGroup.name}"?\n\nSe borrará TODO:\n• Todos los regalos\n• Todas las reservas\n• Todos los miembros\n\nEsta acción NO se puede deshacer.`)) {
      return;
    }
    
    // Delete group (members and gifts will be deleted via CASCADE)
    await supabase.from('groups').delete().eq('id', selectedGroup.id);
    setSelectedGroup(null);
    loadGroups();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center">
        <div className="text-2xl text-red-600">Cargando...</div>
      </div>
    );
  }

  // Login/Register View
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border-4 border-red-200">
          <div className="text-center mb-8">
            <Gift className="w-20 h-20 mx-auto text-red-600 mb-4" />
            <h1 className="text-4xl font-bold text-red-700 mb-2">Paje Digital</h1>
            <p className="text-gray-600 mb-4">Organiza los regalos de Reyes en familia</p>
            
            {/* Countdown to Reyes */}
            <div className="bg-gradient-to-r from-red-100 to-green-100 rounded-lg p-3 md:p-4 border-2 border-red-300">
              <p className="text-xs md:text-sm font-semibold text-red-700 mb-2">⏰ Faltan para Reyes:</p>
              <div className="flex justify-center gap-2 md:gap-3 text-center">
                <div className="bg-white rounded-lg px-2 md:px-3 py-2 min-w-[50px] md:min-w-[60px]">
                  <div className="text-xl md:text-2xl font-bold text-red-600">{countdown.months}</div>
                  <div className="text-xs text-gray-600">meses</div>
                </div>
                <div className="bg-white rounded-lg px-2 md:px-3 py-2 min-w-[50px] md:min-w-[60px]">
                  <div className="text-xl md:text-2xl font-bold text-red-600">{countdown.days}</div>
                  <div className="text-xs text-gray-600">días</div>
                </div>
                <div className="bg-white rounded-lg px-2 md:px-3 py-2 min-w-[50px] md:min-w-[60px]">
                  <div className="text-xl md:text-2xl font-bold text-red-600">{countdown.hours}</div>
                  <div className="text-xs text-gray-600">horas</div>
                </div>
                <div className="bg-white rounded-lg px-2 md:px-3 py-2 min-w-[50px] md:min-w-[60px]">
                  <div className="text-xl md:text-2xl font-bold text-red-600">{countdown.minutes}</div>
                  <div className="text-xs text-gray-600">min</div>
                </div>
                <div className="bg-white rounded-lg px-2 md:px-3 py-2 min-w-[50px] md:min-w-[60px]">
                  <div className="text-xl md:text-2xl font-bold text-red-600">{countdown.seconds}</div>
                  <div className="text-xs text-gray-600">seg</div>
                </div>
              </div>
            </div>
          </div>

          {authError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {authError}
            </div>
          )}

          <div className="space-y-4">
            {view === 'login' ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => setView('register')}
                  className="w-full text-red-600 py-2 font-medium hover:text-red-700"
                >
                  ¿No tienes cuenta? Regístrate
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de usuario</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                    minLength={6}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  Registrarse
                </button>
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="w-full text-green-600 py-2 font-medium hover:text-green-700"
                >
                  ¿Ya tienes cuenta? Inicia sesión
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Groups List View
  if (!selectedGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-red-200">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-red-700">Paje Digital</h1>
                  <p className="text-gray-600">Hola, {user.user_metadata?.username || user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 transition"
                >
                  <LogOut size={20} />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
              
              {/* Compact countdown - full width on mobile */}
              <div className="bg-gradient-to-r from-red-50 to-green-50 rounded-lg px-4 py-3 border border-red-200">
                <div className="text-xs text-red-700 font-semibold mb-2 text-center">⏰ Faltan para Reyes:</div>
                <div className="flex justify-center gap-2 text-center">
                  <div className="bg-white rounded px-2 py-1 min-w-[45px]">
                    <div className="text-lg font-bold text-red-600">{countdown.months}</div>
                    <div className="text-xs text-gray-600">m</div>
                  </div>
                  <div className="bg-white rounded px-2 py-1 min-w-[45px]">
                    <div className="text-lg font-bold text-red-600">{countdown.days}</div>
                    <div className="text-xs text-gray-600">d</div>
                  </div>
                  <div className="bg-white rounded px-2 py-1 min-w-[45px]">
                    <div className="text-lg font-bold text-red-600">{countdown.hours}</div>
                    <div className="text-xs text-gray-600">h</div>
                  </div>
                  <div className="bg-white rounded px-2 py-1 min-w-[45px]">
                    <div className="text-lg font-bold text-red-600">{countdown.minutes}</div>
                    <div className="text-xs text-gray-600">m</div>
                  </div>
                  <div className="bg-white rounded px-2 py-1 min-w-[45px]">
                    <div className="text-lg font-bold text-red-600">{countdown.seconds}</div>
                    <div className="text-xs text-gray-600">s</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-green-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Mis Familias</h2>
            
            <div className="grid gap-4 mb-6">
              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition text-left"
                >
                  <div className="flex items-center gap-3">
                    <Users className="text-red-600" size={24} />
                    <div>
                      <h3 className="font-semibold text-lg">{group.name}</h3>
                      {group.admin_id === user.id && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowGroupForm(!showGroupForm)}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Crear Familia
              </button>
              
              <button
                onClick={() => setShowGroupForm(showGroupForm === 'join' ? false : 'join')}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Users size={20} />
                Unirse a Familia
              </button>
            </div>

            {showGroupForm === true && (
              <form onSubmit={createGroup} className="mt-6 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <h3 className="font-semibold mb-3">Crear Nueva Familia</h3>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Nombre de la familia"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                  >
                    Crear
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGroupForm(false)}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {showGroupForm === 'join' && (
              <form onSubmit={joinGroup} className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <h3 className="font-semibold mb-3">Unirse a Familia</h3>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Código de invitación"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    Unirse
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGroupForm(false)}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Group View with Gifts
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 mb-6 border-2 border-red-200">
          <div className="flex flex-col gap-3">
            {/* First row: Back button and title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedGroup(null)}
                className="text-gray-600 hover:text-red-600 flex-shrink-0"
              >
                ← Volver
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-3xl font-bold text-red-700 truncate">{selectedGroup.name}</h1>
                <p className="text-xs md:text-sm text-gray-600">{members.length} miembros</p>
              </div>
            </div>
            
            {/* Second row: Countdown - compact on mobile */}
            <div className="bg-gradient-to-r from-red-50 to-green-50 rounded-lg px-3 py-2 border border-red-200">
              <div className="text-xs text-red-700 font-semibold text-center mb-1">⏰ Reyes en:</div>
              <div className="flex justify-center gap-1 text-center text-xs">
                <div><span className="font-bold text-red-600">{countdown.months}</span>m</div>
                <div><span className="font-bold text-red-600">{countdown.days}</span>d</div>
                <div><span className="font-bold text-red-600">{countdown.hours}</span>h</div>
                <div><span className="font-bold text-red-600">{countdown.minutes}</span>m</div>
                <div><span className="font-bold text-red-600">{countdown.seconds}</span>s</div>
              </div>
            </div>
            
            {/* Third row: Admin controls and buttons */}
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              {selectedGroup.admin_id === user.id && (
                <div className="flex gap-2 flex-1">
                  <div className="px-3 py-2 bg-yellow-100 rounded-lg flex-1">
                    <p className="text-xs text-gray-600">Código:</p>
                    <p className="font-mono font-bold text-yellow-800 text-sm break-all">{selectedGroup.invite_code}</p>
                  </div>
                  <button
                    onClick={deleteGroup}
                    className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                    title="Eliminar familia"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              )}
              
              <div className="flex gap-2 flex-wrap">
                {notificationPermission === 'default' && (
                  <button
                    onClick={requestNotificationPermission}
                    className="px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition text-xs font-medium flex-1 sm:flex-initial whitespace-nowrap"
                    title="Activar notificaciones del navegador"
                  >
                    🔔 Activar
                  </button>
                )}
                {notificationPermission === 'granted' && (
                  <div className="px-2 py-2 bg-green-50 text-green-700 rounded-lg text-xs flex items-center gap-1 flex-1 sm:flex-initial justify-center">
                    ✅ Notif ON
                  </div>
                )}
                {notificationPermission === 'denied' && (
                  <button 
                    onClick={() => {
                      if (isIOSSafari) {
                        alert('🔕 Las notificaciones están bloqueadas en tu iPhone/iPad.\n\nPara activarlas:\n\n1. Ve a Ajustes de iOS\n2. Safari → Sitios web → Notificaciones\n3. Busca este sitio y permite notificaciones\n\n💡 Más fácil: usa Chrome o Firefox en iOS (funcionan directo).');
                      } else {
                        alert('🔕 Las notificaciones están bloqueadas.\n\nPara activarlas:\n\n📱 Chrome/Edge:\n• Toca el candado/info (🔒) arriba\n• Permisos → Notificaciones → Permitir\n\n🦊 Firefox:\n• Toca el candado (🔒) arriba\n• Permisos → Notificaciones → Permitir\n\n🧭 Safari:\n• Safari → Preferencias → Sitios web → Notificaciones\n• Busca este sitio y permite');
                      }
                    }}
                    className="px-2 py-2 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-1 flex-1 sm:flex-initial justify-center cursor-pointer hover:bg-red-100 transition"
                    title="Toca para ver cómo desbloquear notificaciones"
                  >
                    🔕 Bloqueado - Toca
                  </button>
                )}
                {notificationPermission === 'unsupported' && isIOSSafari && (
                  <button 
                    onClick={() => alert('🔔 Notificaciones en tu iPhone/iPad:\n\nPara que funcionen necesitas:\n\n1️⃣ iOS 16.4 o más nuevo\n\n2️⃣ Añadir esta web a tu pantalla de inicio:\n   • Toca "Compartir" (□↑) abajo\n   • Selecciona "Añadir a pantalla de inicio"\n   • Dale un nombre\n\n3️⃣ Abre la app desde el icono de tu pantalla\n\n4️⃣ Ahora sí podrás activar notificaciones\n\n💡 Más fácil: usa Chrome o Firefox en iOS')}
                    className="px-2 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-xs flex items-center gap-1 flex-1 sm:flex-initial justify-center cursor-pointer hover:bg-yellow-100 transition"
                    title="Toca para ver cómo activar notificaciones en iOS"
                  >
                    ⚠️ iOS - Toca aquí
                  </button>
                )}
                {notificationPermission === 'unsupported' && !isIOSSafari && (
                  <div 
                    className="px-2 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs flex items-center gap-1 flex-1 sm:flex-initial justify-center cursor-help"
                    title="Tu navegador no soporta notificaciones push. Usa Chrome, Firefox o Safari actualizado."
                  >
                    ❌ No disponible
                  </div>
                )}
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) markNotificationsAsRead();
                  }}
                  className="relative px-3 py-2 text-gray-600 hover:text-blue-600 transition flex-shrink-0"
                  title="Ver notificaciones"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 text-gray-600 hover:text-red-600 flex items-center gap-1 flex-shrink-0"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline text-sm">Salir</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowGiftForm(!showGiftForm)}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-lg"
          >
            <Plus size={24} />
            Añadir Regalo a Mi Lista
          </button>
        </div>

        {showGiftForm && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-green-200">
            <form onSubmit={createGift} className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Nuevo Regalo</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ¿Qué regalo quieres? *
                </label>
                <input
                  type="text"
                  value={giftName}
                  onChange={(e) => setGiftName(e.target.value)}
                  placeholder="Ej: Zapatillas Nike Air, Libro de cocina..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detalles (talla, color, modelo...)
                </label>
                <textarea
                  value={giftDescription}
                  onChange={(e) => setGiftDescription(e.target.value)}
                  placeholder="Ej: Talla 42, color negro, modelo Air Max..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enlace (opcional)
                </label>
                <input
                  type="url"
                  value={giftUrl}
                  onChange={(e) => setGiftUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto (opcional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setGiftImage(e.target.files[0])}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
                >
                  Añadir Regalo
                </button>
                <button
                  type="button"
                  onClick={() => setShowGiftForm(false)}
                  className="px-6 py-3 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gifts.map(gift => {
            const isMyGift = gift.user_id === user.id;
            const reservation = gift.reservations?.[0];
            const isReservedByMe = reservation?.user_id === user.id;
            
            return (
              <div
                key={gift.id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 ${
                  isMyGift ? 'border-blue-200' : reservation ? 'border-yellow-200' : 'border-gray-200'
                }`}
              >
                {gift.image_url && (
                  <img
                    src={gift.image_url}
                    alt={gift.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800">{gift.name}</h3>
                      <p className="text-sm text-gray-600">Para: {gift.user.username}</p>
                    </div>
                    {selectedGroup.admin_id === user.id && (
                      <button
                        onClick={() => deleteGift(gift.id, gift.name)}
                        className="text-red-500 hover:text-red-700"
                        title="Solo el administrador puede eliminar regalos"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  {gift.description && (
                    <p className="text-sm text-gray-700 mb-3">{gift.description}</p>
                  )}

                  {gift.url && (
                    <a
                      href={gift.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mb-3"
                    >
                      <LinkIcon size={14} />
                      Ver producto
                    </a>
                  )}

                  {!isMyGift && (
                    <div className="mt-4 pt-4 border-t">
                      {isReservedByMe ? (
                        <button
                          onClick={() => toggleReservation(gift.id, true)}
                          className="w-full bg-yellow-500 text-white py-2 rounded-lg font-semibold hover:bg-yellow-600 flex items-center justify-center gap-2"
                        >
                          <Check size={18} />
                          Ya lo tengo reservado
                        </button>
                      ) : reservation ? (
                        <div className="text-center text-sm text-gray-600">
                          <p className="font-semibold">Reservado por:</p>
                          <p className="text-green-600">{reservation.reserved_by.username}</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleReservation(gift.id, false)}
                          className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
                        >
                          <Gift size={18} />
                          Lo voy a regalar yo
                        </button>
                      )}
                    </div>
                  )}

                  {isMyGift && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <p className="text-sm text-blue-800 font-medium">
                          Este es tu regalo
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          No puedes ver quién lo ha reservado
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {gifts.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-200">
            <Gift size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Aún no hay regalos
            </h3>
            <p className="text-gray-500">
              ¡Sé el primero en añadir un regalo a la lista!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
