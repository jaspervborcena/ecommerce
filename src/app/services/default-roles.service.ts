import { Injectable } from '@angular/core';
import { RoleDefinition, RolePermissions } from './role-definition.service';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { OfflineDocumentService } from '../core/services/offline-document.service';

@Injectable({ providedIn: 'root' })
export class DefaultRolesService {
  constructor(
    private firestore: Firestore,
    private offlineDocService: OfflineDocumentService
  ) {}

  getDefaultRoles(companyId: string, storeId: string): RoleDefinition[] {
    const now = new Date();
    const customerPermissions: RolePermissions = {
      canViewPOS: false,
      canAddStore: false,
      canAddProducts: false,
      canViewProducts: false,
      canViewStore: false,
      canViewInventory: false,
      canRemoveUsers: false,
      canAddUser: false,
      canMakePOS: false,
      canViewCompanyProfile: false,
      canEditCompanyProfile: false,
      canAddCompanyProfile: false,
      canViewOverview: false
    };
    const operationalPermissions: RolePermissions = {
      ...customerPermissions,
      canViewProducts: true,
      canViewStore: true,
      canViewOverview: true
    };
    return [
      {
        roleId: 'creator',
        companyId,
        storeId,
        permissions: {
          canViewPOS: true,
          canAddStore: true,
          canAddProducts: true,
          canViewProducts: true,
          canViewStore: true,
          canViewInventory: true,
          canRemoveUsers: true,
          canAddUser: true,
          canMakePOS: true,
          canViewCompanyProfile: true,
          canEditCompanyProfile: true,
          canAddCompanyProfile: true,
          canViewOverview: true
        },
        createdAt: now,
        updatedAt: now
      },
      ...[
        ['guest', customerPermissions],
        ['registered_customer', customerPermissions],
        ['subscriber', customerPermissions],
        ['seller', operationalPermissions],
        ['store_owner', operationalPermissions],
        ['packaging_staff', operationalPermissions],
        ['delivery_dispatcher', operationalPermissions],
        ['delivery_rider', operationalPermissions],
        ['support_agent', operationalPermissions],
        ['marketing_manager', operationalPermissions]
      ].map(([roleId, permissions]) => ({
        roleId: roleId as string,
        companyId,
        storeId,
        permissions: permissions as RolePermissions,
        createdAt: now,
        updatedAt: now
      })),
      {
        roleId: 'store_manager',
        companyId,
        storeId,
        permissions: {
          canViewPOS: true,
          canAddStore: true,
          canAddProducts: true,
          canViewProducts: true,
          canViewStore: true,
          canViewInventory: true,
          canRemoveUsers: true,
          canAddUser: true,
          canMakePOS: true,
          canViewCompanyProfile: true,
          canEditCompanyProfile: true,
          canAddCompanyProfile: true,
          canViewOverview: true
        },
        createdAt: now,
        updatedAt: now
      },
      {
        roleId: 'cashier',
        companyId,
        storeId,
        permissions: {
          canViewPOS: true,
          canAddStore: false,
          canAddProducts: false,
          canViewProducts: true,
          canViewStore: false,
          canViewInventory: false,
          canRemoveUsers: false,
          canAddUser: false,
          canMakePOS: true,
          canViewCompanyProfile: true,
          canEditCompanyProfile: false,
          canAddCompanyProfile: false,
          canViewOverview: false
        },
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  async createDefaultRoles(companyId: string, storeId: string): Promise<void> {
    const roles = this.getDefaultRoles(companyId, storeId);
    for (const role of roles) {
      // 🔥 NEW APPROACH: Use OfflineDocumentService for offline-safe creation
      const documentId = await this.offlineDocService.createDocument('roleDefinition', role);
      console.log('✅ Default role created with ID:', documentId, `(${role.roleId})`, navigator.onLine ? '(online)' : '(offline)');
    }
  }
}
