// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  writeBatch
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAlxlLnnaDLH8m_fakDamP5pz6LDIHCN0U",
  authDomain: "javaiportal.firebaseapp.com",
  projectId: "javaiportal",
  storageBucket: "javaiportal.firebasestorage.app",
  messagingSenderId: "278906752823",
  appId: "1:278906752823:web:0d610ce536be966ecd94b2",
  measurementId: "G-VMQLF77LGR"
};

const app = initializeApp(firebaseConfig);

// Analytics só no browser (evita erros em ambientes sem window)
let analytics = null;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    console.warn("Analytics não inicializado:", e.message);
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export { analytics };

// Exporta funções de autenticação
export { signInWithEmailAndPassword, onAuthStateChanged };

// ============================================
// FUNÇÕES DE PEDIDOS
// ============================================

// Função para criar pedido
export async function criarPedido(dados) {
  try {
    const docRef = await addDoc(collection(db, "pedidos"), {
      ...dados,
      status: "pendente",
      dataCriacao: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    throw error;
  }
}

// Função para buscar pedidos do restaurante
export async function buscarPedidos(estabelecimentoId) {
  try {
    const q = query(
      collection(db, "pedidos"),
      where("estabelecimentoId", "==", estabelecimentoId),
      orderBy("dataCriacao", "desc")
    );
    const snapshot = await getDocs(q);
    const pedidos = [];
    snapshot.forEach((doc) => {
      pedidos.push({ id: doc.id, ...doc.data() });
    });
    return pedidos;
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    return [];
  }
}

// ============================================
// FUNÇÕES DE ENDEREÇOS DO ESTABELECIMENTO
// ============================================

/**
 * Buscar todos os endereços de coleta do estabelecimento
 * @param {string} estabelecimentoId - ID do estabelecimento
 * @returns {Promise<Array>} Lista de endereços
 */
export async function buscarEnderecosEstabelecimento(estabelecimentoId) {
  try {
    if (!estabelecimentoId) {
      console.warn('buscarEnderecosEstabelecimento: estabelecimentoId não fornecido');
      return [];
    }

    const q = query(
      collection(db, "estabelecimentos", estabelecimentoId, "enderecos"),
      orderBy("criadoEm", "asc")
    );
    
    const snapshot = await getDocs(q);
    const enderecos = [];
    snapshot.forEach((doc) => {
      enderecos.push({ 
        id: doc.id, 
        ...doc.data() 
      });
    });
    
    return enderecos;
  } catch (error) {
    console.error("Erro ao buscar endereços:", error);
    return [];
  }
}

/**
 * Salvar um endereço de coleta (criar ou atualizar)
 * @param {string} estabelecimentoId - ID do estabelecimento
 * @param {Object} endereco - Dados do endereço
 * @param {string} endereco.nome - Nome do endereço (ex: "Matriz", "Filial Centro")
 * @param {string} endereco.uf - UF (ex: "SP")
 * @param {string} endereco.cidade - Nome da cidade
 * @param {string} endereco.bairro - Bairro
 * @param {string} endereco.logradouro - Rua, Avenida, etc.
 * @param {string} endereco.numero - Número
 * @param {string} endereco.complemento - Complemento (opcional)
 * @param {string} endereco.id - ID do endereço (para atualização)
 * @returns {Promise<Object>} Endereço salvo com ID
 */
export async function salvarEnderecoEstabelecimento(estabelecimentoId, endereco) {
  try {
    if (!estabelecimentoId) {
      throw new Error('estabelecimentoId não fornecido');
    }

    if (!endereco) {
      throw new Error('Dados do endereço não fornecidos');
    }

    // Validações básicas
    if (!endereco.logradouro || !endereco.numero || !endereco.cidade || !endereco.uf) {
      throw new Error('Campos obrigatórios: logradouro, numero, cidade, uf');
    }

    // Monta o endereço completo
    const enderecoCompleto = `${endereco.logradouro}, ${endereco.numero}${endereco.complemento ? ` - ${endereco.complemento}` : ''}${endereco.bairro ? `, ${endereco.bairro}` : ''}, ${endereco.cidade} - ${endereco.uf}`;

    const dados = {
      nome: endereco.nome || 'Endereço Principal',
      uf: endereco.uf.toUpperCase(),
      cidade: endereco.cidade,
      bairro: endereco.bairro || '',
      logradouro: endereco.logradouro,
      numero: endereco.numero,
      complemento: endereco.complemento || '',
      enderecoCompleto: enderecoCompleto,
      atualizadoEm: serverTimestamp()
    };

    const enderecosRef = collection(db, "estabelecimentos", estabelecimentoId, "enderecos");

    if (endereco.id) {
      // Atualizar endereço existente
      const docRef = doc(db, "estabelecimentos", estabelecimentoId, "enderecos", endereco.id);
      await updateDoc(docRef, dados);
      
      // Buscar o documento atualizado
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Endereço não encontrado após atualização');
      }
    } else {
      // Criar novo endereço
      dados.criadoEm = serverTimestamp();
      const docRef = await addDoc(enderecosRef, dados);
      
      // Buscar o documento criado
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return { id: docRef.id, ...dados };
      }
    }
  } catch (error) {
    console.error("Erro ao salvar endereço:", error);
    throw error;
  }
}

/**
 * Deletar um endereço de coleta
 * @param {string} estabelecimentoId - ID do estabelecimento
 * @param {string} enderecoId - ID do endereço
 * @returns {Promise<void>}
 */
export async function deletarEnderecoEstabelecimento(estabelecimentoId, enderecoId) {
  try {
    if (!estabelecimentoId || !enderecoId) {
      throw new Error('estabelecimentoId e enderecoId são obrigatórios');
    }

    const docRef = doc(db, "estabelecimentos", estabelecimentoId, "enderecos", enderecoId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Erro ao deletar endereço:", error);
    throw error;
  }
}

/**
 * Buscar um endereço específico
 * @param {string} estabelecimentoId - ID do estabelecimento
 * @param {string} enderecoId - ID do endereço
 * @returns {Promise<Object|null>} Endereço encontrado ou null
 */
export async function buscarEnderecoPorId(estabelecimentoId, enderecoId) {
  try {
    if (!estabelecimentoId || !enderecoId) {
      return null;
    }

    const docRef = doc(db, "estabelecimentos", estabelecimentoId, "enderecos", enderecoId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar endereço:", error);
    return null;
  }
}

/**
 * Definir um endereço como padrão
 * @param {string} estabelecimentoId - ID do estabelecimento
 * @param {string} enderecoId - ID do endereço
 * @returns {Promise<void>}
 */
export async function definirEnderecoPadrao(estabelecimentoId, enderecoId) {
  try {
    if (!estabelecimentoId || !enderecoId) {
      throw new Error('estabelecimentoId e enderecoId são obrigatórios');
    }

    // Busca todos os endereços
    const enderecos = await buscarEnderecosEstabelecimento(estabelecimentoId);
    
    // Remove o padrão de todos e define o novo em uma única operação atômica
    const batch = writeBatch(db);
    
    for (const endereco of enderecos) {
      const docRef = doc(db, "estabelecimentos", estabelecimentoId, "enderecos", endereco.id);
      batch.update(docRef, { isPadrao: false });
    }
    
    // Define o novo padrão
    const docRef = doc(db, "estabelecimentos", estabelecimentoId, "enderecos", enderecoId);
    batch.update(docRef, { isPadrao: true });
    
    await batch.commit();
  } catch (error) {
    console.error("Erro ao definir endereço padrão:", error);
    throw error;
  }
}

// ============================================
// FUNÇÕES AUXILIARES DE VALIDAÇÃO
// ============================================

/**
 * Validar se um endereço está completo
 * @param {Object} endereco - Endereço a ser validado
 * @returns {boolean} True se completo
 */
export function validarEndereco(endereco) {
  return !!(endereco && 
    endereco.logradouro && 
    endereco.numero && 
    endereco.cidade && 
    endereco.uf);
}

/**
 * Formatar endereço para exibição
 * @param {Object} endereco - Dados do endereço
 * @returns {string} Endereço formatado
 */
export function formatarEndereco(endereco) {
  if (!endereco) return '';
  
  const partes = [];
  
  if (endereco.logradouro) partes.push(endereco.logradouro);
  if (endereco.numero) partes.push(endereco.numero);
  if (endereco.complemento) partes.push(`- ${endereco.complemento}`);
  if (endereco.bairro) partes.push(endereco.bairro);
  if (endereco.cidade) partes.push(endereco.cidade);
  if (endereco.uf) partes.push(`- ${endereco.uf}`);
  
  return partes.join(' ');
}

export default {
  auth,
  db,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  criarPedido,
  buscarPedidos,
  buscarEnderecosEstabelecimento,
  salvarEnderecoEstabelecimento,
  deletarEnderecoEstabelecimento,
  buscarEnderecoPorId,
  definirEnderecoPadrao,
  validarEndereco,
  formatarEndereco
};
