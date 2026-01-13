
import React, { useState, useMemo } from 'react';
import { Member } from '../types';
import Modal from './Modal';
import { EditIcon, DeleteIcon, UserPlusIcon } from './icons';

interface MembersProps {
  members: Member[];
  addHistoricMember: (member: Omit<Member, 'id'>) => void;
  updateMember: (member: Member) => void;
  deleteMember: (memberId: string) => void;
  defaultMembershipFee: number;
}

const Members: React.FC<MembersProps> = ({ members, addHistoricMember, updateMember, deleteMember, defaultMembershipFee }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editFormState, setEditFormState] = useState<Member | null>(null);
  
  const initialAddFormState = useMemo(() => ({
    name: '',
    email: '',
    dateOfBirth: '',
    nationality: '',
    sex: 'Prefer not to say' as Member['sex'],
    idType: 'National ID' as Member['idType'],
    idNumber: '',
    membershipFee: defaultMembershipFee,
    joinDate: new Date().toISOString().split('T')[0],
  }), [defaultMembershipFee]);

  const [addFormState, setAddFormState] = useState(initialAddFormState);

  const [filters, setFilters] = useState({
    name: '',
    email: '',
    nationality: '',
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const nameMatch = member.name.toLowerCase().includes(filters.name.toLowerCase());
      const emailMatch = member.email.toLowerCase().includes(filters.email.toLowerCase());
      const nationalityMatch = member.nationality.toLowerCase().includes(filters.nationality.toLowerCase());
      return nameMatch && emailMatch && nationalityMatch;
    });
  }, [members, filters]);

  const openEditModal = (member: Member) => {
    setSelectedMember(member);
    // Ensure joinDate is in 'YYYY-MM-DD' format for the input
    const formattedMember = {
        ...member,
        joinDate: new Date(member.joinDate).toISOString().split('T')[0]
    };
    setEditFormState(formattedMember);
    setIsEditModalOpen(true);
  };
  
  const openAddModal = () => {
    setAddFormState(initialAddFormState);
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsEditModalOpen(false);
    setIsAddModalOpen(false);
    setSelectedMember(null);
    setEditFormState(null);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editFormState) return;
    const { name, value } = e.target;
    if (name === 'membershipFee') {
        setEditFormState(prev => prev ? { ...prev, [name]: parseFloat(value) || 0 } : null);
    } else {
        setEditFormState(prev => prev ? { ...prev, [name]: value } : null);
    }
  };
  
  const handleAddFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'membershipFee') {
        setAddFormState(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
        setAddFormState(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editFormState) {
       // Convert joinDate back to ISO string before updating
      const memberToUpdate = {
        ...editFormState,
        joinDate: new Date(editFormState.joinDate).toISOString(),
      };
      updateMember(memberToUpdate);
    }
    closeModal();
  };
  
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const memberToAdd = {
        ...addFormState,
        joinDate: new Date(addFormState.joinDate).toISOString(),
    };
    addHistoricMember(memberToAdd);
    closeModal();
  }
  
  const handleDelete = (memberId: string, memberName: string) => {
    if (window.confirm(`Are you sure you want to delete the member "${memberName}"? This will also remove them from the sellers list.`)) {
      deleteMember(memberId);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Member Management</h2>
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 dynamic-btn text-white font-semibold rounded-lg shadow-md transition-colors"
        >
          <UserPlusIcon className="w-5 h-5 mr-2" />
          Add Historic Member
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-x-auto">
        <table className="w-full whitespace-nowrap">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Email', 'Date of Birth', 'Nationality', 'Sex', 'ID Type', 'ID Number', 'Fee Paid', 'Join Date', 'Actions'].map(header => (
                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
              ))}
            </tr>
            <tr className="bg-gray-100">
              <th className="px-6 py-2">
                <input
                  type="text"
                  name="name"
                  placeholder="Filter by name..."
                  value={filters.name}
                  onChange={handleFilterChange}
                  className="w-full p-1 border border-gray-300 rounded-md text-sm font-normal"
                />
              </th>
              <th className="px-6 py-2">
                <input
                  type="text"
                  name="email"
                  placeholder="Filter by email..."
                  value={filters.email}
                  onChange={handleFilterChange}
                  className="w-full p-1 border border-gray-300 rounded-md text-sm font-normal"
                />
              </th>
              <th className="px-6 py-2"></th>
              <th className="px-6 py-2">
                 <input
                  type="text"
                  name="nationality"
                  placeholder="Filter by nationality..."
                  value={filters.nationality}
                  onChange={handleFilterChange}
                  className="w-full p-1 border border-gray-300 rounded-md text-sm font-normal"
                />
              </th>
              <th className="px-6 py-2" colSpan={6}></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMembers.map(member => (
              <tr key={member.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{member.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{member.email}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(member.dateOfBirth).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{member.nationality}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{member.sex}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{member.idType}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{member.idNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-500">€{member.membershipFee.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(member.joinDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => openEditModal(member)} className="text-blue-600 hover:text-blue-800">
                            <EditIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(member.id, member.name)} className="text-red-600 hover:text-red-800">
                            <DeleteIcon className="w-5 h-5" />
                        </button>
                    </div>
                </td>
              </tr>
            ))}
             {filteredMembers.length === 0 && (
                <tr>
                    <td colSpan={10} className="text-center py-10 text-gray-500">No members found.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={closeModal} title={`Edit Member: ${selectedMember?.name}`}>
        {editFormState && (
            <form onSubmit={handleEditSubmit}>
                <div className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" name="name" id="name" value={editFormState.name} onChange={handleEditFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" name="email" id="email" value={editFormState.email} onChange={handleEditFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <input type="date" name="dateOfBirth" id="dateOfBirth" value={editFormState.dateOfBirth} onChange={handleEditFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">Nationality</label>
                    <input type="text" name="nationality" id="nationality" value={editFormState.nationality} onChange={handleEditFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="sex" className="block text-sm font-medium text-gray-700">Sex</label>
                    <select name="sex" id="sex" value={editFormState.sex} onChange={handleEditFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="idType" className="block text-sm font-medium text-gray-700">ID Type</label>
                    <select name="idType" id="idType" value={editFormState.idType} onChange={handleEditFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                      <option>National ID</option>
                      <option>Passport</option>
                      <option>Driving License</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700">ID Number</label>
                    <input type="text" name="idNumber" id="idNumber" value={editFormState.idNumber} onChange={handleEditFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                  </div>
                </div>
                 <div>
                    <label htmlFor="membershipFee" className="block text-sm font-medium text-gray-700">Membership Fee (€)</label>
                    <input type="number" step="0.01" name="membershipFee" id="membershipFee" value={editFormState.membershipFee} onChange={handleEditFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="joinDate" className="block text-sm font-medium text-gray-700">Join Date</label>
                    <input type="date" name="joinDate" id="joinDate" value={editFormState.joinDate} onChange={handleEditFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button type="button" onClick={closeModal} className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white dynamic-btn rounded-md shadow-sm">Save Changes</button>
                </div>
            </form>
        )}
      </Modal>

      <Modal isOpen={isAddModalOpen} onClose={closeModal} title="Add Historic Member">
            <form onSubmit={handleAddSubmit}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="add-name" className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input type="text" name="name" id="add-name" value={addFormState.name} onChange={handleAddFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="add-email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" name="email" id="add-email" value={addFormState.email} onChange={handleAddFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="add-dateOfBirth" className="block text-sm font-medium text-gray-700">Date of Birth</label>
                        <input type="date" name="dateOfBirth" id="add-dateOfBirth" value={addFormState.dateOfBirth} onChange={handleAddFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="add-nationality" className="block text-sm font-medium text-gray-700">Nationality</label>
                        <input type="text" name="nationality" id="add-nationality" value={addFormState.nationality} onChange={handleAddFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="add-sex" className="block text-sm font-medium text-gray-700">Sex</label>
                        <select name="sex" id="add-sex" value={addFormState.sex} onChange={handleAddFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                            <option>Prefer not to say</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="add-idType" className="block text-sm font-medium text-gray-700">ID Type</label>
                            <select name="idType" id="add-idType" value={addFormState.idType} onChange={handleAddFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                                <option>National ID</option>
                                <option>Passport</option>
                                <option>Driving License</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="add-idNumber" className="block text-sm font-medium text-gray-700">ID Number</label>
                            <input type="text" name="idNumber" id="add-idNumber" value={addFormState.idNumber} onChange={handleAddFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="add-membershipFee" className="block text-sm font-medium text-gray-700">Membership Fee (€)</label>
                        <input type="number" step="0.01" name="membershipFee" id="add-membershipFee" value={addFormState.membershipFee} onChange={handleAddFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="add-joinDate" className="block text-sm font-medium text-gray-700">Join Date</label>
                        <input type="date" name="joinDate" id="add-joinDate" value={addFormState.joinDate} onChange={handleAddFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button type="button" onClick={closeModal} className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white dynamic-btn rounded-md shadow-sm">Add Member</button>
                </div>
            </form>
      </Modal>

    </div>
  );
};

export default Members;
