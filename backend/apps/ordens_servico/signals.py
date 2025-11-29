from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import OrdemServico


@receiver(pre_save, sender=OrdemServico)
def gerar_numero_os(sender, instance, **kwargs):
    """Gera número automático de OS se não existir."""
    if not instance.numero:
        # Buscar a última OS para gerar o próximo número
        ultima_os = OrdemServico.objects.order_by('-numero').first()
        if ultima_os and ultima_os.numero:
            try:
                # Tenta extrair o número da última OS
                ultimo_num = int(ultima_os.numero.split('-')[-1])
                novo_num = ultimo_num + 1
            except (ValueError, IndexError):
                novo_num = 1
        else:
            novo_num = 1

        # Formato: OS-0001, OS-0002, etc.
        instance.numero = f"OS-{novo_num:04d}"


@receiver(pre_save, sender=OrdemServico)
def definir_data_finalizacao(sender, instance, **kwargs):
    """Define data_finalizacao quando status muda para 'finalizada'."""
    if instance.pk:
        # Se já existe, verifica se o status mudou
        try:
            os_antiga = OrdemServico.objects.get(pk=instance.pk)
            if os_antiga.status != 'finalizada' and instance.status == 'finalizada':
                # Status mudou para finalizada
                if not instance.data_finalizacao:
                    instance.data_finalizacao = timezone.now()
            elif instance.status != 'finalizada':
                # Status não é mais finalizada, limpa a data
                instance.data_finalizacao = None
        except OrdemServico.DoesNotExist:
            # Nova instância
            if instance.status == 'finalizada' and not instance.data_finalizacao:
                instance.data_finalizacao = timezone.now()
    else:
        # Nova instância sendo criada
        if instance.status == 'finalizada' and not instance.data_finalizacao:
            instance.data_finalizacao = timezone.now()

