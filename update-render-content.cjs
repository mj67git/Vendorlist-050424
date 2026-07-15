const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  // Views Content
  const renderContent = () => {
    let content;
    let keyName = '';

    if (selectedVendor) {
      keyName = \`vendor-\${selectedVendor.id}\`;
      content = <VendorDetail db={db} vendor={selectedVendor} materials={materials} onBack={goBack} onSave={handleUpdateVendor} onDelete={handleDeleteVendor} currentUser={currentUser} />;
    } else if (view === 'home') {
      keyName = 'home';
      content = <HomeView db={db} materials={materials} onNavigate={navigate} onSelectVendor={handleSelectVendor} onAddVendor={handleAddVendor} currentUser={currentUser} onDownloadBackup={handleDownloadBackup} />;
    } else if (view === 'archive') {
      if (currentUser?.role === 'admin') {
        keyName = 'archive';
        content = <ArchiveView db={db} currentUser={currentUser} />;
      } else {
        keyName = 'home-fallback';
        content = <HomeView db={db} materials={materials} onNavigate={navigate} onSelectVendor={handleSelectVendor} onAddVendor={handleAddVendor} currentUser={currentUser} onDownloadBackup={handleDownloadBackup} />;
      }
    } else if (view === 'supplier-audit') {
      keyName = 'supplier-audit';
      content = <SupplierAuditView db={db} onSelectVendor={handleSelectVendor} currentUser={currentUser} />;
    } else if (view === 'material-master') {
      keyName = 'material-master';
      content = (
        <MaterialMasterView
          materials={materials}
          vendors={db}
          onSaveMaterial={handleSaveMaterial}
          onDeleteMaterial={handleDeleteMaterial}
          onNavigateToVendor={(vendorId) => {
            const v = db.find(x => x.id === vendorId);
            if (v) {
              handleSelectVendor(v);
            }
          }}
          currentUserRole={currentUser?.role}
        />
      );
    } else if (view === 'category' && categoryId) {
      keyName = \`category-\${categoryId}\`;
      content = <CategoryView db={db} categoryId={categoryId} onSelectVendor={handleSelectVendor} currentUser={currentUser} expandedMaterial={expandedMaterial} onToggleMaterial={setExpandedMaterial} />;
    } else {
      keyName = 'home-fallback';
      content = <HomeView db={db} onNavigate={navigate} onSelectVendor={handleSelectVendor} onAddVendor={handleAddVendor} currentUser={currentUser} onDownloadBackup={handleDownloadBackup} />;
    }

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={keyName}
          initial={{ opacity: 0, y: 10, filter: 'blur(2px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(2px)' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full h-full"
        >
          {content}
        </motion.div>
      </AnimatePresence>
    );
  };`;

const replacement = `  // Views Content
  const renderContent = () => {
    let mainContent;
    let keyName = '';

    if (view === 'home') {
      keyName = 'home';
      mainContent = <HomeView db={db} materials={materials} onNavigate={navigate} onSelectVendor={handleSelectVendor} onAddVendor={handleAddVendor} currentUser={currentUser} onDownloadBackup={handleDownloadBackup} />;
    } else if (view === 'archive') {
      if (currentUser?.role === 'admin') {
        keyName = 'archive';
        mainContent = <ArchiveView db={db} currentUser={currentUser} />;
      } else {
        keyName = 'home-fallback';
        mainContent = <HomeView db={db} materials={materials} onNavigate={navigate} onSelectVendor={handleSelectVendor} onAddVendor={handleAddVendor} currentUser={currentUser} onDownloadBackup={handleDownloadBackup} />;
      }
    } else if (view === 'supplier-audit') {
      keyName = 'supplier-audit';
      mainContent = <SupplierAuditView db={db} onSelectVendor={handleSelectVendor} currentUser={currentUser} />;
    } else if (view === 'material-master') {
      keyName = 'material-master';
      mainContent = (
        <MaterialMasterView
          materials={materials}
          vendors={db}
          onSaveMaterial={handleSaveMaterial}
          onDeleteMaterial={handleDeleteMaterial}
          onNavigateToVendor={(vendorId) => {
            const v = db.find(x => x.id === vendorId);
            if (v) {
              handleSelectVendor(v);
            }
          }}
          currentUserRole={currentUser?.role}
        />
      );
    } else if (view === 'category' && categoryId) {
      keyName = \`category-\${categoryId}\`;
      mainContent = <CategoryView db={db} categoryId={categoryId} onSelectVendor={handleSelectVendor} currentUser={currentUser} expandedMaterial={expandedMaterial} onToggleMaterial={setExpandedMaterial} />;
    } else {
      keyName = 'home-fallback';
      mainContent = <HomeView db={db} onNavigate={navigate} onSelectVendor={handleSelectVendor} onAddVendor={handleAddVendor} currentUser={currentUser} onDownloadBackup={handleDownloadBackup} />;
    }

    return (
      <div className="relative w-full h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={keyName}
            initial={{ opacity: 0, y: 10, filter: 'blur(2px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(2px)' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full h-full"
          >
            {mainContent}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {selectedVendor && (
            <>
              {/* Drawer Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={goBack}
                className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-[2px] cursor-pointer print:hidden"
              />
              
              {/* Drawer Content */}
              <motion.div
                initial={{ x: '-100%', opacity: 0, boxShadow: '0 0 0 rgba(0,0,0,0)' }}
                animate={{ x: 0, opacity: 1, boxShadow: '20px 0 50px rgba(0,0,0,0.1)' }}
                exit={{ x: '-100%', opacity: 0, boxShadow: '0 0 0 rgba(0,0,0,0)' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-full md:w-[85%] lg:w-[75%] xl:w-[65%] bg-slate-50 shadow-2xl z-50 border-r border-slate-200 overflow-y-auto print:static print:w-full print:border-none print:shadow-none"
              >
                <div className="p-4 md:p-6 lg:p-8 min-h-full">
                  <VendorDetail db={db} vendor={selectedVendor} materials={materials} onBack={goBack} onSave={handleUpdateVendor} onDelete={(id) => { handleDeleteVendor(id); goBack(); }} currentUser={currentUser} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };`;

fs.writeFileSync('src/App.tsx', code.replace(target, replacement));
console.log('Done');
