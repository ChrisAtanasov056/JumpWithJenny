import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FaEdit, FaTrashAlt, FaSearch, FaPlus } from 'react-icons/fa';
import UserService from '../../../services/UserServices';
import AdminConfirmModal from '../shared/AdminConfirmModal';
import AdminUserModal from './AdminUserModal';
import './AdminUsers.scss';

const PAGE_SIZE = 25;

const AdminUsersList = () => {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  const [pagedResult, setPagedResult] = useState({
    Users: [],
    Page: 1,
    PageSize: PAGE_SIZE,
    TotalCount: 0,
    TotalPages: 0,
    HasPreviousPage: false,
    HasNextPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await UserService.getUsersPaged({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
      });

      if (Array.isArray(response)) {
        setPagedResult({
          Users: response,
          Page: 1,
          PageSize: response.length || PAGE_SIZE,
          TotalCount: response.length,
          TotalPages: 1,
          HasPreviousPage: false,
          HasNextPage: false,
        });
      } else {
        setPagedResult(response);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || t('admin.users.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSaveUser = async (updatedUser) => {
    const savedUser = await UserService.updateUser(updatedUser.Id, updatedUser);
    const mergedUser = savedUser?.Id ? savedUser : updatedUser;
    setPagedResult((prev) => ({
      ...prev,
      Users: (prev.Users || []).map((u) => (u.Id === mergedUser.Id ? mergedUser : u)),
    }));
    setSelectedUser(mergedUser);
    toast.success(t('admin.users.updateSuccess'));
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await UserService.deleteUser(deleteTarget.Id);
      toast.success(t('admin.users.deleteSuccess'));
      setDeleteTarget(null);
      setIsModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        err?.message;
      toast.error(serverMessage || t('admin.users.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleLabel = (role) => {
    if (!role) return '-';
    const normalized = role.toLowerCase();
    if (normalized === 'administrator') return t('admin.roles.administrator');
    if (normalized === 'admin') return t('admin.roles.admin');
    if (normalized === 'user') return t('admin.roles.user');
    return role;
  };

  const users = pagedResult?.Users || [];

  return (
    <div className="admin-users-page">
      <div className="adm-page-header">
        <div className="adm-title-group">
          <h1>{t('admin.users.title')}</h1>
          <p>{t('admin.users.subtitle')}</p>
        </div>

        <div className="adm-header-actions">
          <Link to="/admin/users/new" className="adm-btn adm-btn--primary">
            <FaPlus aria-hidden="true" /> {t('admin.users.addNew').replace(/^\+\s*/, '')}
          </Link>
        </div>
      </div>

      <div className="adm-card users-toolbar">
        <div className="adm-search-field">
          <FaSearch className="adm-search-icon" aria-hidden="true" />
          <input
            type="text"
            className="adm-input"
            placeholder={t('admin.users.searchPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label={t('admin.users.searchAriaLabel')}
          />
        </div>
      </div>

      {error && (
        <div className="adm-alert adm-alert--error">
          {t('admin.common.errorPrefix')} {error}
        </div>
      )}

      {loading ? (
        <div className="adm-loading" role="status">{t('admin.users.loading')}</div>
      ) : users.length === 0 ? (
        <div className="adm-empty">
          <h3>{debouncedSearch ? t('admin.users.noMatchingUsers') : t('admin.users.noUsers')}</h3>
        </div>
      ) : (
        <>
          <div className="adm-card users-table-card">
            <table className="users-table">
              <thead>
                <tr>
                  <th>{t('admin.users.table.username')}</th>
                  <th>{t('admin.users.table.email')}</th>
                  <th>{t('admin.users.table.fullName')}</th>
                  <th>{t('admin.users.table.role')}</th>
                  <th>{t('admin.users.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.Id}>
                    <td><strong>{user.Username || '-'}</strong></td>
                    <td>{user.Email || '-'}</td>
                    <td>{`${user.FirstName || ''} ${user.LastName || ''}`.trim() || '-'}</td>
                    <td>
                      <span className={`role-pill ${(user.Role || '').toLowerCase()}`}>
                        {getRoleLabel(user.Role)}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="adm-btn adm-btn--secondary adm-btn--sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsModalOpen(true);
                          }}
                          aria-label={t('admin.users.editAriaLabel')}
                        >
                          <FaEdit aria-hidden="true" /> {t('admin.common.edit')}
                        </button>
                        <button
                          type="button"
                          className="adm-btn adm-btn--danger-soft adm-btn--sm"
                          onClick={() => setDeleteTarget(user)}
                          aria-label={t('admin.users.deleteAriaLabel')}
                        >
                          <FaTrashAlt aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagedResult.TotalPages > 1 && (
            <div className="adm-pagination">
              <span className="tabular-nums">
                {t('admin.common.pageInfo', {
                  page: pagedResult.Page,
                  totalPages: pagedResult.TotalPages,
                  totalCount: pagedResult.TotalCount,
                })}
              </span>
              <div className="adm-pagination-controls">
                <button
                  type="button"
                  className="adm-btn adm-btn--secondary adm-btn--sm"
                  disabled={!pagedResult.HasPreviousPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t('admin.common.previousPage')}
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn--secondary adm-btn--sm"
                  disabled={!pagedResult.HasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('admin.common.nextPage')}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {isModalOpen && selectedUser && (
        <AdminUserModal
          user={selectedUser}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          onSave={handleSaveUser}
          onDelete={() => setDeleteTarget(selectedUser)}
        />
      )}

      <AdminConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={t('admin.users.deleteModal.title')}
        message={
          deleteTarget
            ? t('admin.users.deleteModal.prompt', {
                username: deleteTarget.Username || deleteTarget.Email,
              })
            : ''
        }
        warning={t('admin.users.deleteModal.warning')}
        confirmLabel={t('admin.users.deleteModal.confirm')}
        isSubmitting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !isDeleting && setDeleteTarget(null)}
      />
    </div>
  );
};

export default AdminUsersList;
