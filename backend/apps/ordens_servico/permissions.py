from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permissão customizada que permite apenas ao criador da OS editá-la,
    ou qualquer usuário autenticado pode ler.
    Permite que qualquer usuário autenticado atualize o status (para drag and drop).
    """

    def has_object_permission(self, request, view, obj):
        # Permissões de leitura para qualquer usuário autenticado
        if request.method in permissions.SAFE_METHODS:
            return True

        # Se for atualização de status via action, permitir para qualquer usuário autenticado
        if hasattr(view, 'action') and view.action == 'update_status':
            return True

        # Se for PATCH no endpoint de atualizar-status, permitir para qualquer usuário autenticado
        if request.method == 'PATCH' and 'atualizar-status' in request.path:
            return True

        # Se for PATCH apenas com status, permitir para qualquer usuário autenticado
        if request.method == 'PATCH' and request.data and 'status' in request.data:
            # Verificar se só tem status no request.data
            data_keys = set(request.data.keys())
            if data_keys == {'status'} or data_keys == {'status', 'csrfmiddlewaretoken'}:
                return True

        # Permitir atualização de entregue, foto_entrega e forma_pagamento para qualquer usuário autenticado
        if request.method == 'PATCH' and request.data:
            data_keys = set(request.data.keys())

            # Se estiver atualizando apenas entregue e/ou foto_entrega e/ou forma_pagamento, permitir
            # FormData pode ter outros campos, então verificamos se os campos principais são apenas esses
            allowed_keys = {'entregue', 'foto_entrega', 'forma_pagamento'}

            # Verificar se está atualizando algum dos campos permitidos
            if any(key in data_keys for key in allowed_keys):
                # Verificar se os outros campos (além dos permitidos) são apenas campos técnicos
                other_keys = data_keys - allowed_keys
                # Se não há outros campos ou apenas campos técnicos, permitir
                if len(other_keys) == 0 or other_keys.issubset({'csrfmiddlewaretoken'}):
                    return True

        # Permissões de escrita para outros campos apenas para o criador
        return obj.usuario_criacao == request.user


class IsStaffOnly(permissions.BasePermission):
    """
    Permissão que permite acesso apenas para usuários com is_staff=True (Patrão).
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_staff


class CanFinalizeOS(permissions.BasePermission):
    """
    Permissão que permite finalizar OS apenas para patrão (is_staff=True).
    """

    def has_permission(self, request, view):
        # Verificar se é uma requisição de atualização de status
        if request.method == 'PATCH' and 'atualizar-status' in request.path:
            # Verificar se está tentando finalizar
            if request.data.get('status') == 'finalizada':
                return request.user and request.user.is_authenticated and request.user.is_staff
        return True  # Permitir outras operações

    def has_object_permission(self, request, view, obj):
        # Se está tentando finalizar, verificar se é patrão
        if request.data.get('status') == 'finalizada':
            return request.user and request.user.is_authenticated and request.user.is_staff
        # Permitir outras mudanças de status
        return True

