const fs = require('fs');

let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

// 1. Añadir currentCheckoutId
content = content.replace(
`  const [pendingQueue, setPendingQueue] = useState<PendingOrder[]>([]);`,
`  const [pendingQueue, setPendingQueue] = useState<PendingOrder[]>([]);
  const [currentCheckoutId, setCurrentCheckoutId] = useState<string | null>(null);

  useEffect(() => {
    // Si cambia el carrito, invalidamos el checkout id actual para permitir un nuevo pedido
    if (cartItems.length > 0) {
       setCurrentCheckoutId(null);
    }
  }, [cartItems]);`
);

// 2. Modificar handleCheckout
const oldCheckoutStart = `  const handleCheckout = async () => {
    if (!selectedCustomer || cartItems.length === 0) return;
    setIsCheckingOut(true);`;

const newCheckoutStart = `  const handleCheckout = async () => {
    if (!selectedCustomer || cartItems.length === 0) return;
    
    // Si ya existe en la cola, bloquemos la creación de uno nuevo
    if (currentCheckoutId && pendingQueue.some(o => o.clientRequestId === currentCheckoutId)) {
        addToast("Este pedido ya está en la cola de envíos.");
        return;
    }
    
    setIsCheckingOut(true);`;

content = content.replace(oldCheckoutStart, newCheckoutStart);

const uuidRegex = /const clientRequestId = uuidv4\(\);/;
content = content.replace(uuidRegex, 
`let clientRequestId = currentCheckoutId;
    if (!clientRequestId) {
        clientRequestId = uuidv4();
        setCurrentCheckoutId(clientRequestId);
    }`);

// 3. Modificar autosaveDraft
content = content.replace(
`  const autosaveDraft = (cart: CartItem[], customer: Customer | null) => {
    if (!sellerId) return;
    saveDraft({
      sellerId,
      selectedClientId: customer?.id,
      cart: cart.map(item => ({ productId: item.product.id, quantity: item.quantity, sizes: item.sizes })),
      updatedAt: Date.now()
    });
  };`,
`  const autosaveDraft = (cart: CartItem[], customer: Customer | null) => {
    if (!sellerId) return;
    saveDraft({
      sellerId,
      selectedClientId: customer?.id,
      cart: cart.map(item => ({ productId: item.product.id, quantity: item.quantity, sizes: item.sizes })),
      updatedAt: Date.now()
    }).catch(err => {
      console.error('Error al autoguardar borrador:', err);
      addToast('Error local: tu borrador no pudo ser protegido en el almacenamiento.');
    });
  };`
);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
