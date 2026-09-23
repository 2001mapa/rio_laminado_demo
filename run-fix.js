const fs = require('fs');
let text = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

const oldHandleCreateCustomer = `  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) {
      addToast("El nombre del cliente es obligatorio.");
      return;
    }
    const tempId = \`temp-\${Date.now()}\`;
    const newCustomer: Customer = {
      id: tempId,
      username: 'temp_' + tempId,
      name: newCustomerName.trim(),
      email: newCustomerEmail.trim() || \`temp_\${tempId}@local.test\`,
      discount: 0,
      showDiscount: false,
      status: 'active',
      phone: newCustomerPhone.trim() || 'No especificado',
      address: newCustomerAddress.trim() || 'No especificada',
    };
    
    addCustomer(newCustomer);
    addToast(\`Cliente \${newCustomer.name} creado.\`);
    
    // Auto select
    setSelectedCustomer(newCustomer);
    setShowNewCustomerModal(false);
    setNewCustomerName("");
    setNewCustomerEmail("");
    setNewCustomerPhone("");
    setNewCustomerAddress("");
    setStep(2);
  };`;

const newHandleCreateCustomer = `  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) {
      addToast("El nombre del cliente es obligatorio.");
      return;
    }
    
    setIsCreatingCustomer(true);
    try {
      const { createCustomer } = await import('@/app/actions/clients');
      const res = await createCustomer({
        name: newCustomerName.trim(),
        username: \`cliente_\${Date.now()}\`,
        email: newCustomerEmail.trim() || \`cliente_\${Date.now()}@local.test\`,
        phone: newCustomerPhone.trim() || 'No especificado',
        address: newCustomerAddress.trim() || 'No especificada',
        discount: 0,
        showDiscount: false
      });

      if (!res.success || !res.customer) {
        throw new Error(res.message || 'Error al crear cliente');
      }

      addToast(\`Cliente \${res.customer.name} creado.\`);
      setSelectedCustomer(res.customer as any);
      setShowNewCustomerModal(false);
      setNewCustomerName("");
      setNewCustomerEmail("");
      setNewCustomerPhone("");
      setNewCustomerAddress("");
      setStep(2);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsCreatingCustomer(false);
    }
  };`;

text = text.replace(oldHandleCreateCustomer, newHandleCreateCustomer);

text = text.replace(/const handleCheckout = async \(\) => \{[\s\S]*?\};/, `const handleCheckout = async () => {
    if (!selectedCustomer || cartItems.length === 0 || isCheckingOut) return;
    
    setIsCheckingOut(true);
    if (scannerRef.current && isScanning) {
      await scannerRef.current.stop();
    }
    
    const result = await checkoutSeller(selectedCustomer.id, cartItems); 
    if (result && result.success) { 
      addToast("Venta registrada con éxito! Pedido #" + result.order.number); 
      router.push('/vendedor'); 
    } else { 
      alert('Error: ' + (result?.error || '')); 
      setIsCheckingOut(false);
    }
  };`);

text = text.replace(/disabled=\{cartItems\.length === 0 \|\| \!selectedCustomer\}/, `disabled={cartItems.length === 0 || !selectedCustomer || isCheckingOut}`);
text = text.replace(/Finalizar Venta <Check className=\"w-5 h-5 ml-2\"\/>/, `{isCheckingOut ? "Procesando..." : "Finalizar Venta"} <Check className="w-5 h-5 ml-2"/>`);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', text);
