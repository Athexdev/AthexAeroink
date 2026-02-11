from django.db import models

class Sketch(models.Model):
    # This will store the actual image file in media/sketches/
    image = models.ImageField(upload_to='sketches/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Sketch {self.id} - {self.created_at}"