import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAlxlLnnaDLH8m_fakDamP5pz6LDIHCN0U',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'javaiportal.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'javaiportal',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'javaiportal.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '278906752823',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:278906752823:web:0d610ce536be966ecd94b2',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-VMQLF77LGR',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword };

export async function criarPedido(dados) {
  const docRef = await addDoc(collection(db, 'pedidos'), {
    ...dados,
    status: 'pendente',
    dataCriacao: serverTimestamp(),
  });
  return docRef.id;
}

export async function buscarPedidos(estabelecimentoId) {
  if (!estabelecimentoId) return [];

  try {
    const pedidosRef = collection(db, 'pedidos');
    const q = query(pedidosRef, where('estabelecimentoId', '==', estabelecimentoId), orderBy('dataCriacao', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }));
  } catch (error) {
    console.warn('Consulta ordenada indisponível; usando consulta de contingência.', error);
    try {
      const snapshot = await getDocs(query(collection(db, 'pedidos'), where('estabelecimentoId', '==', estabelecimentoId)));
      return snapshot.docs
        .map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))
        .sort((a, b) => String(b.dataCriacao || '').localeCompare(String(a.dataCriacao || '')));
    } catch (fallbackError) {
      console.error('Erro ao buscar pedidos:', fallbackError);
      return [];
    }
  }
}

export async function buscarEnderecosEstabelecimento(estabelecimentoId) {
  if (!estabelecimentoId) return [];

  const enderecosRef = collection(db, 'estabelecimentos', estabelecimentoId, 'enderecos');
  try {
    const snapshot = await getDocs(query(enderecosRef, orderBy('criadoEm', 'asc')));
    return snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }));
  } catch (error) {
    console.warn('Consulta ordenada de endereços indisponível; usando consulta de contingência.', error);
    const snapshot = await getDocs(enderecosRef);
    return snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }));
  }
}

export async function salvarEnderecoEstabelecimento(estabelecimentoId, endereco) {
  if (!estabelecimentoId) throw new Error('estabelecimentoId não fornecido');
  if (!endereco) throw new Error('Dados do endereço não fornecidos');
  if (!endereco.logradouro || !endereco.numero || !endereco.cidade || !endereco.uf) {
    throw new Error('Campos obrigatórios: logradouro, numero, cidade, uf');
  }

  const ufNormalizada = endereco.uf.trim().toUpperCase();
  const enderecoCompleto = `${endereco.logradouro.trim()}, ${endereco.numero.trim()}${endereco.complemento ? ` - ${endereco.complemento.trim()}` : ''}${endereco.bairro ? `, ${endereco.bairro.trim()}` : ''}, ${endereco.cidade.trim()} - ${ufNormalizada}`;
  const dados = {
    nome: endereco.nome?.trim() || 'Endereço Principal',
    uf: ufNormalizada,
    cidade: endereco.cidade.trim(),
    bairro: endereco.bairro?.trim() || '',
    logradouro: endereco.logradouro.trim(),
    numero: endereco.numero.trim(),
    complemento: endereco.complemento?.trim() || '',
    enderecoCompleto,
    atualizadoEm: serverTimestamp(),
  };

  const enderecosRef = collection(db, 'estabelecimentos', estabelecimentoId, 'enderecos');
  const docRef = endereco.id
    ? doc(db, 'estabelecimentos', estabelecimentoId, 'enderecos', endereco.id)
    : await addDoc(enderecosRef, { ...dados, criadoEm: serverTimestamp() });

  if (endereco.id) await updateDoc(docRef, dados);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : { id: docRef.id, ...dados };
}

export async function deletarEnderecoEstabelecimento(estabelecimentoId, enderecoId) {
  if (!estabelecimentoId || !enderecoId) throw new Error('estabelecimentoId e enderecoId são obrigatórios');
  await deleteDoc(doc(db, 'estabelecimentos', estabelecimentoId, 'enderecos', enderecoId));
}

export async function buscarEnderecoPorId(estabelecimentoId, enderecoId) {
  if (!estabelecimentoId || !enderecoId) return null;
  const snapshot = await getDoc(doc(db, 'estabelecimentos', estabelecimentoId, 'enderecos', enderecoId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function definirEnderecoPadrao(estabelecimentoId, enderecoId) {
  if (!estabelecimentoId || !enderecoId) throw new Error('estabelecimentoId e enderecoId são obrigatórios');
  const enderecos = await buscarEnderecosEstabelecimento(estabelecimentoId);
  const batch = writeBatch(db);

  enderecos.forEach((endereco) => {
    batch.update(doc(db, 'estabelecimentos', estabelecimentoId, 'enderecos', endereco.id), {
      isPadrao: endereco.id === enderecoId,
    });
  });

  await batch.commit();
}

export function validarEndereco(endereco) {
  return Boolean(endereco?.logradouro?.trim() && endereco?.numero?.trim() && endereco?.cidade?.trim() && endereco?.uf?.trim());
}

export function formatarEndereco(endereco) {
  if (!endereco) return '';
  return [
    endereco.logradouro,
    endereco.numero,
    endereco.complemento && `- ${endereco.complemento}`,
    endereco.bairro,
    endereco.cidade,
    endereco.uf && `- ${endereco.uf}`,
  ].filter(Boolean).join(' ');
}

export default {
  auth,
  db,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  criarPedido,
  buscarPedidos,
  buscarEnderecosEstabelecimento,
  salvarEnderecoEstabelecimento,
  deletarEnderecoEstabelecimento,
  buscarEnderecoPorId,
  definirEnderecoPadrao,
  validarEndereco,
  formatarEndereco,
  setDoc,
};
