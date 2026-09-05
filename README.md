# 🍽️ Ja Vai — Portal do Restaurante

Sistema de gestão de entregas para restaurantes.  
Peça motoboys, calcule rotas, gerencie endereços de coleta e acompanhe pedidos.

## ✨ Funcionalidades

- **Login seguro** com Firebase Authentication
- **Chamar entregador** com múltiplas entregas por pedido
- **Mapa interativo** (Leaflet + Routing Machine) com cálculo de distância
- **Endereços de coleta** salvos por estabelecimento
- **Meus Dados** — perfil e configurações do restaurante
- Interface responsiva, mobile-first e visual moderno

## 🚀 Como rodar

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

## 🛠️ Stack

- React 19 + Vite
- Firebase (Auth + Firestore)
- React Router
- Leaflet + leaflet-routing-machine
- Deploy via Firebase Hosting

## 📁 Estrutura

```
src/
├── App.jsx          # Rotas e auth guard
├── Login.jsx        # Tela de login
├── Menu.jsx         # Layout principal + sidebar
├── Chamar.jsx       # Formulário de pedidos / entregas
├── MapaRota.jsx     # Mapa e cálculo de rotas
├── MeusDados.jsx    # Dados do estabelecimento
├── firebase.js      # Config + helpers Firestore
└── index.css        # Design system global
```

## 🎨 Design

Tema quente (vermelho + amarelo), tipografia limpa, cards com glassmorphism leve e animações suaves.  
Otimizado para desktop e mobile.

## 📝 Notas

- As credenciais do Firebase estão em `src/firebase.js` (projeto `javaiportal`).
- Em produção, configure regras de segurança do Firestore adequadas.
- O histórico de pedidos ainda está como “em breve”.

---

Feito com ❤️ para restaurantes que precisam de entregas rápidas.
