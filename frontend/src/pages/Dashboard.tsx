import { useState } from 'react';
import { OSBoard } from '../components/dashboard/OSBoard';
import { NewOSModal } from '../components/dashboard/NewOSModal';
import { OSDetailsModal } from '../components/dashboard/OSDetailsModal';
import type { OrdemServico } from '../types';

export const Dashboard = () => {
  const [showNewOSModal, setShowNewOSModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOSId, setSelectedOSId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleViewDetails = (ordem: OrdemServico) => {
    setSelectedOSId(ordem.id);
    setShowDetailsModal(true);
  };

  const handleNewOS = () => {
    setShowNewOSModal(true);
  };

  const handleOSCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="p-6">
      <OSBoard
        key={refreshKey}
        onViewDetails={handleViewDetails}
        onNewOS={handleNewOS}
      />
      <NewOSModal
        isOpen={showNewOSModal}
        onClose={() => setShowNewOSModal(false)}
        onSuccess={handleOSCreated}
      />
      <OSDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedOSId(null);
        }}
        ordemId={selectedOSId}
      />
    </div>
  );
};

