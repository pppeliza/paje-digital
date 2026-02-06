import React, { useState, useEffect } from 'react';
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
  }, []);

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupData();
    }
  }, [selectedGroup]);

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
      setAuthError(error.message);
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
      setAuthError(error.message);
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

  const createGroup = async (e) => {
    e.preventDefault();
    
    const { data: groupData, error } = await supabase
      .from('groups')
      .insert([{ name: groupName, admin_id: user.id }])
      .select()
      .single();

    if (!error && groupData) {
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

  const deleteGift = async (giftId) => {
    await supabase.from('gifts').delete().eq('id', giftId);
    loadGroupData();
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
            <p className="text-gray-600">Organiza los regalos de Reyes en familia</p>
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
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-red-700">Paje Digital</h1>
                <p className="text-gray-600">Hola, {user.user_metadata?.username || user.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 transition"
              >
                <LogOut size={20} />
                Salir
              </button>
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
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-red-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedGroup(null)}
                className="text-gray-600 hover:text-red-600"
              >
                ← Volver
              </button>
              <div>
                <h1 className="text-3xl font-bold text-red-700">{selectedGroup.name}</h1>
                <p className="text-sm text-gray-600">{members.length} miembros</p>
              </div>
            </div>
            <div className="flex gap-2">
              {selectedGroup.admin_id === user.id && (
                <div className="px-4 py-2 bg-yellow-100 rounded-lg">
                  <p className="text-xs text-gray-600">Código de invitación:</p>
                  <p className="font-mono font-bold text-yellow-800">{selectedGroup.invite_code}</p>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-gray-600 hover:text-red-600"
              >
                <LogOut size={20} />
              </button>
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
                    {isMyGift && (
                      <button
                        onClick={() => deleteGift(gift.id)}
                        className="text-red-500 hover:text-red-700"
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
