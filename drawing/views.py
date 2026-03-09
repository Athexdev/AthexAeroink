import base64
from django.shortcuts import render
from django.core.files.base import ContentFile
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Sketch

def index(request):
    return render(request, 'drawing/index.html')

@csrf_exempt
def save_sketch(request):
    if request.method == 'POST':
        img_data = request.POST.get('image')
        if img_data:
            format, imgstr = img_data.split(';base64,')
            ext = format.split('/')[-1]
            # Use unique names to avoid overwriting like debesh 01, debesh02
            import uuid
            file = ContentFile(base64.b64decode(imgstr), name=f"art_{uuid.uuid4()}.{ext}")
            sketch = Sketch.objects.create(image=file)
            return JsonResponse({'status': 'success', 'id': sketch.id})
    return JsonResponse({'status': 'failed'}, status=400)