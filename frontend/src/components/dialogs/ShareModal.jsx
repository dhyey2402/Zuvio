import React, { useState } from 'react';
import { useShares } from '../../hooks/useShares';
import { useAuth } from '../../contexts/AuthContext';
import { 
  X, Users, Link as LinkIcon, ChevronDown, 
  UserPlus, Mail, Shield, ShieldAlert, Globe, Loader2, 
  FileText, FolderOpen, User, Check
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../ui/Button';

export function ShareModal({ isOpen, onClose, item, type }) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState('');
  
  // Public link states
  const [generalAccess, setGeneralAccess] = useState('RESTRICTED'); // RESTRICTED | PUBLIC
  const [publicLinkToken, setPublicLinkToken] = useState(null);
  const [publicLinkRole, setPublicLinkRole] = useState('VIEWER');

  const { 
    shares, isLoadingShares, sharesError,
    createShare, isCreatingShare,
    updateShareRole, isUpdatingShareRole,
    removeShare, isRemovingShare,
    createPublicLink, isCreatingPublicLink,
    revokePublicLink, isRevokingPublicLink
  } = useShares(item?.id, type);

  if (!isOpen || !item) return null;

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    try {
      await createShare({
        fileId: type === 'file' ? item.id : null,
        folderId: type === 'folder' ? item.id : null,
        recipientEmail: email.trim(),
        role
      });
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to share');
    }
  };

  const handleUpdateRole = async (shareId, newRole) => {
    try {
      await updateShareRole({ shareId, role: newRole });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveAccess = async (shareId) => {
    try {
      await removeShare(shareId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGeneralAccessChange = async (e) => {
    const access = e.target.value;
    setGeneralAccess(access);
    
    if (access === 'PUBLIC' && !publicLinkToken) {
      try {
        const link = await createPublicLink({
          fileId: type === 'file' ? item.id : null,
          folderId: type === 'folder' ? item.id : null,
          role: publicLinkRole
        });
        setPublicLinkToken(link.token);
      } catch (err) {
        console.error("Failed to create public link", err);
        setGeneralAccess('RESTRICTED'); // revert on failure
      }
    } else if (access === 'RESTRICTED' && publicLinkToken) {
      try {
        await revokePublicLink(publicLinkToken);
        setPublicLinkToken(null);
      } catch (err) {
        console.error("Failed to revoke public link", err);
      }
    }
  };

  const copyLink = () => {
    // Generate the URL depending on access level
    let link = '';
    if (generalAccess === 'PUBLIC' && publicLinkToken) {
      link = `${window.location.origin}/shared/${publicLinkToken}`;
    } else {
      link = `${window.location.origin}/dashboard/${type === 'folder' ? 'folder' : 'file'}/${item.id}`;
    }
    
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={() => onClose()} 
        aria-hidden="true"
      />
      
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-xl", type === 'folder' ? 'bg-blue-500/10 text-blue-500' : 'bg-primary/10 text-primary')}>
              {type === 'folder' ? <FolderOpen className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground leading-tight truncate max-w-[280px]" title={item.name}>Share "{item.name}"</h2>
              <p className="text-xs text-muted-foreground">Manage access and permissions</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Add People Section */}
          <section>
            <form onSubmit={handleShare} className="relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input 
                    type="email" 
                    placeholder="Add people by email..."
                    className="pl-9 h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isCreatingShare}
                  />
                </div>
                
                <div className="relative">
                  <select
                    className="h-11 px-3 py-2 bg-background border border-input rounded-md text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none pr-8 cursor-pointer"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={isCreatingShare}
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="EDITOR">Editor</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              
              {error && <p className="text-sm text-destructive mt-2">{error}</p>}
              
              {email.trim() && (
                <div className="mt-3 flex justify-end">
                  <Button type="submit" disabled={isCreatingShare} className="h-9 px-4">
                    {isCreatingShare ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Send Invite
                  </Button>
                </div>
              )}
            </form>
          </section>

          {/* Current Access Section */}
          <section>
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              People with access
            </h3>
            
            <div className="space-y-3">
              {/* Owner (Simulated) */}
              <div className="flex items-center justify-between p-2 hover:bg-accent/30 rounded-lg transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">You</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email || 'owner@example.com'}</p>
                  </div>
                </div>
                <div className="text-xs font-medium text-muted-foreground px-3 py-1 bg-muted rounded-full shrink-0">
                  Owner
                </div>
              </div>

              {isLoadingShares ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : shares?.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground bg-muted/30 rounded-lg border border-border/50 border-dashed">
                  Only you have access
                  <p className="text-xs mt-1">Invite people to collaborate on this file.</p>
                </div>
              ) : (
                shares?.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-2 hover:bg-accent/30 rounded-lg transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-medium text-blue-500 uppercase">
                          {share.recipient_email?.[0] || 'U'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{share.recipient_email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <div className="relative">
                        <select
                          className="h-8 pl-2 pr-7 bg-transparent border-transparent hover:bg-muted rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                          value={share.role}
                          onChange={(e) => handleUpdateRole(share.id, e.target.value)}
                        >
                          <option value="VIEWER">Viewer</option>
                          <option value="EDITOR">Editor</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 text-muted-foreground pointer-events-none" />
                      </div>
                      <button 
                        onClick={() => handleRemoveAccess(share.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        title="Remove access"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* General Access / Public Link Section */}
        <div className="p-6 bg-muted/20 border-t border-border/50 shrink-0">
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors",
              generalAccess === 'PUBLIC' ? "bg-green-500/20" : "bg-muted"
            )}>
              {generalAccess === 'PUBLIC' ? (
                <Globe className="w-5 h-5 text-green-600" />
              ) : (
                <Shield className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground">General access</h3>
              <div className="flex items-center gap-2 mt-1">
                <select 
                  className="h-7 text-xs bg-transparent font-medium border-transparent hover:bg-muted/50 rounded appearance-none pl-1 pr-5 relative focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  value={generalAccess}
                  onChange={handleGeneralAccessChange}
                  disabled={isCreatingPublicLink || isRevokingPublicLink}
                >
                  <option value="RESTRICTED">Restricted</option>
                  <option value="PUBLIC">Anyone with the link</option>
                </select>
                <ChevronDown className="w-3 h-3 text-muted-foreground -ml-5 pointer-events-none" />
                
                {isCreatingPublicLink && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-2" />}
                
                {generalAccess === 'PUBLIC' && (
                  <>
                    <span className="text-muted-foreground mx-1 text-xs">•</span>
                    <select
                      className="h-7 text-xs bg-transparent font-medium text-muted-foreground border-transparent hover:bg-muted/50 rounded appearance-none pl-1 pr-5 relative focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                      value={publicLinkRole}
                      onChange={(e) => setPublicLinkRole(e.target.value)}
                    >
                      <option value="VIEWER">Viewer</option>
                      <option value="EDITOR">Editor</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-muted-foreground -ml-5 pointer-events-none" />
                    
                    <span className="text-muted-foreground mx-1 text-xs">•</span>
                    <select
                      className="h-7 text-xs bg-transparent font-medium text-muted-foreground border-transparent hover:bg-muted/50 rounded appearance-none pl-1 pr-5 relative focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                      defaultValue=""
                      onChange={(e) => {
                        // Re-create link with new expiration
                        if (e.target.value) {
                          createPublicLink({
                            fileId: type === 'file' ? item.id : null,
                            folderId: type === 'folder' ? item.id : null,
                            role: publicLinkRole,
                            expiresInDays: parseInt(e.target.value, 10)
                          }).then(link => setPublicLinkToken(link.token));
                        }
                      }}
                    >
                      <option value="">Never expires</option>
                      <option value="1">1 day</option>
                      <option value="7">7 days</option>
                      <option value="30">30 days</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-muted-foreground -ml-5 pointer-events-none" />
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 transition-all">
                {generalAccess === 'PUBLIC' 
                  ? 'Anyone on the internet with the link can access'
                  : 'Only people with access can open with the link'}
              </p>
            </div>
            
            <Button 
              variant="outline" 
              className="shrink-0 gap-2 font-medium"
              onClick={copyLink}
            >
              {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <LinkIcon className="w-4 h-4" />}
              {isCopied ? 'Copied' : 'Copy link'}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
