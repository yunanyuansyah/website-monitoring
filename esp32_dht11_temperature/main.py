from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel  # ← Tambahkan import ini
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, date
import json
import uvicorn  # ← Tambahkan import ini

app = FastAPI(title="Sensor Monitoring API")

# ← Tambahkan CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Untuk development, izinkan semua origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database configuration
DB_CONFIG = {
    "host": "localhost",
    "database": "sensor_db",
    "user": "postgres",
    "password": "radiohead123",
    "port": "5432"
}

class SensorData(BaseModel):
    nama_sensor: str
    nilai: float

class AcuanBakuData(BaseModel):
    min: float
    max: float
    status: str = None

class AcuanBakuUpdate(BaseModel):
    min: float
    max: float
    status: str = None

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

@app.post("/sensor-data")
async def create_sensor_data(sensor_data: SensorData):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor()
        
        # Insert data sensor - tanggal sebagai DATE, waktu sebagai TIMESTAMP
        query = """
        INSERT INTO sensor (nama_sensor, tanggal, nilai, waktu)
        VALUES (%s, %s, %s, %s)
        RETURNING id
        """
        
        current_time = datetime.now()
        # Gunakan hanya tanggal untuk kolom 'tanggal'
        current_date = current_time.date()
        
        cursor.execute(query, (
            sensor_data.nama_sensor,
            current_date,  # Hanya tanggal (YYYY-MM-DD)
            sensor_data.nilai,
            current_time   # Waktu lengkap untuk kolom 'waktu'
        ))
        
        sensor_id = cursor.fetchone()[0]
        
        # Commit transaction
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            "message": "Data sensor berhasil disimpan",
            "sensor_id": sensor_id,
            "tanggal": current_date.isoformat(),
            "waktu": current_time.isoformat()
        }
        
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=f"Error saving data: {str(e)}")

@app.get("/sensor-data")
async def get_sensor_data(limit: int = None):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if limit and limit > 0:
            query = """
            SELECT id, nama_sensor, tanggal, nilai, waktu
            FROM sensor
            ORDER BY waktu DESC
            LIMIT %s
            """
            cursor.execute(query, (limit,))
        else:
            # Jika tidak ada limit, ambil semua data
            query = """
            SELECT id, nama_sensor, tanggal, nilai, waktu
            FROM sensor
            ORDER BY waktu DESC
            """
            cursor.execute(query)
        
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {"data": results}
        
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")

@app.get("/acuan-baku")
async def get_acuan_baku():
    """Get acuan baku (reference standards) for sensor values"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get acuan baku data
        query = "SELECT id, min, max, status FROM acuan_baku ORDER BY id"
        cursor.execute(query)
        acuan_data = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {
            "acuan_baku": acuan_data,
            "message": "Acuan baku retrieved successfully"
        }
        
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Error fetching acuan baku: {str(e)}")

@app.post("/acuan-baku")
async def create_acuan_baku(acuan_data: AcuanBakuData):
    """Create new acuan baku (reference standard)"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor()
        
        # Validate min < max
        if acuan_data.min >= acuan_data.max:
            raise HTTPException(status_code=400, detail="Min value must be less than max value")
        
        # Insert new acuan baku
        query = """
        INSERT INTO acuan_baku (min, max, status)
        VALUES (%s, %s, %s)
        RETURNING id
        """
        
        cursor.execute(query, (
            acuan_data.min,
            acuan_data.max,
            acuan_data.status or f"Range {acuan_data.min}-{acuan_data.max}"
        ))
        
        acuan_id = cursor.fetchone()[0]
        
        # Commit transaction
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            "message": "Acuan baku berhasil dibuat",
            "acuan_id": acuan_id,
            "min": acuan_data.min,
            "max": acuan_data.max,
            "status": acuan_data.status
        }
        
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=f"Error creating acuan baku: {str(e)}")

@app.put("/acuan-baku/{acuan_id}")
async def update_acuan_baku(acuan_id: int, acuan_data: AcuanBakuUpdate):
    """Update existing acuan baku (reference standard)"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor()
        
        # Check if acuan baku exists
        check_query = "SELECT id FROM acuan_baku WHERE id = %s"
        cursor.execute(check_query, (acuan_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Acuan baku tidak ditemukan")
        
        # Validate min < max
        if acuan_data.min >= acuan_data.max:
            raise HTTPException(status_code=400, detail="Min value must be less than max value")
        
        # Update acuan baku
        query = """
        UPDATE acuan_baku 
        SET min = %s, max = %s, status = %s
        WHERE id = %s
        RETURNING id, min, max, status
        """
        
        cursor.execute(query, (
            acuan_data.min,
            acuan_data.max,
            acuan_data.status or f"Range {acuan_data.min}-{acuan_data.max}",
            acuan_id
        ))
        
        updated_data = cursor.fetchone()
        
        # Commit transaction
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            "message": "Acuan baku berhasil diupdate",
            "acuan_id": updated_data[0],
            "min": updated_data[1],
            "max": updated_data[2],
            "status": updated_data[3]
        }
        
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=f"Error updating acuan baku: {str(e)}")

@app.delete("/acuan-baku/{acuan_id}")
async def delete_acuan_baku(acuan_id: int):
    """Delete acuan baku (reference standard)"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor()
        
        # Check if acuan baku exists
        check_query = "SELECT id FROM acuan_baku WHERE id = %s"
        cursor.execute(check_query, (acuan_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Acuan baku tidak ditemukan")
        
        # Delete acuan baku
        delete_query = "DELETE FROM acuan_baku WHERE id = %s"
        cursor.execute(delete_query, (acuan_id,))
        
        # Commit transaction
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            "message": f"Acuan baku ID {acuan_id} berhasil dihapus"
        }
        
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=f"Error deleting acuan baku: {str(e)}")

@app.get("/sensor-status/{sensor_name}")
async def get_sensor_status(sensor_name: str):
    """Get current status of a specific sensor based on acuan baku"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get latest sensor value
        sensor_query = """
        SELECT nilai, waktu 
        FROM sensor 
        WHERE nama_sensor = %s 
        ORDER BY waktu DESC 
        LIMIT 1
        """
        cursor.execute(sensor_query, (sensor_name,))
        sensor_data = cursor.fetchone()
        
        if not sensor_data:
            raise HTTPException(status_code=404, detail=f"Sensor {sensor_name} not found")
        
        # Get acuan baku
        acuan_query = "SELECT min, max, status FROM acuan_baku ORDER BY id"
        cursor.execute(acuan_query)
        acuan_data = cursor.fetchall()
        
        # Determine status based on acuan baku
        current_value = sensor_data['nilai']
        status = "Normal"
        alert_level = "info"
        
        for acuan in acuan_data:
            min_val = acuan['min']
            max_val = acuan['max']
            
            if current_value < min_val:
                status = "BAHAYA - Nilai Terlalu Rendah"
                alert_level = "danger"
                break
            elif current_value > max_val:
                status = "BAHAYA - Nilai Terlalu Tinggi"
                alert_level = "danger"
                break
            elif min_val <= current_value <= max_val:
                status = "Normal"
                alert_level = "success"
                break
        
        cursor.close()
        conn.close()
        
        return {
            "sensor_name": sensor_name,
            "current_value": current_value,
            "timestamp": sensor_data['waktu'],
            "status": status,
            "alert_level": alert_level,
            "acuan_baku": acuan_data
        }
        
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Error checking sensor status: {str(e)}")

@app.get("/sensor-stats")
async def get_sensor_stats():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get total count
        count_query = "SELECT COUNT(*) as total FROM sensor"
        cursor.execute(count_query)
        total_count = cursor.fetchone()['total']
        
        # Get today's count
        today_query = """
        SELECT COUNT(*) as today_count 
        FROM sensor 
        WHERE tanggal = CURRENT_DATE
        """
        cursor.execute(today_query)
        today_count = cursor.fetchone()['today_count']
        
        # Get unique sensor names
        sensor_query = "SELECT DISTINCT nama_sensor FROM sensor"
        cursor.execute(sensor_query)
        unique_sensors = [row['nama_sensor'] for row in cursor.fetchall()]
        
        # Get latest data for chart
        latest_query = """
        SELECT id, nama_sensor, tanggal, nilai, waktu
        FROM sensor
        ORDER BY waktu DESC
        LIMIT 50
        """
        cursor.execute(latest_query)
        latest_data = cursor.fetchall()
        
        # Get acuan baku for status checking
        acuan_query = "SELECT min, max, status FROM acuan_baku ORDER BY id"
        cursor.execute(acuan_query)
        acuan_data = cursor.fetchall()
        
        # Check overall system status based on latest values
        system_status = "Normal"
        alert_count = 0
        
        for sensor_name in unique_sensors:
            # Get latest value for each sensor
            latest_sensor_query = """
            SELECT nilai FROM sensor 
            WHERE nama_sensor = %s 
            ORDER BY waktu DESC 
            LIMIT 1
            """
            cursor.execute(latest_sensor_query, (sensor_name,))
            latest_value = cursor.fetchone()
            
            if latest_value:
                current_value = latest_value['nilai']
                # Check against acuan baku
                for acuan in acuan_data:
                    if current_value < acuan['min'] or current_value > acuan['max']:
                        alert_count += 1
                        system_status = "Waspada"
                        break
        
        if alert_count > 2:
            system_status = "Bahaya"
        
        cursor.close()
        conn.close()
        
        return {
            "total_sensors": len(unique_sensors),
            "total_data": total_count,
            "today_data": today_count,
            "sensor_names": unique_sensors,
            "latest_data": latest_data,
            "system_status": system_status,
            "alert_count": alert_count,
            "acuan_baku": acuan_data
        }
        
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")

@app.get("/debug/sensor-data")
async def debug_sensor_data():
    """Endpoint untuk debugging - tampilkan data mentah dari database"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get sample data untuk debugging
        query = """
        SELECT id, nama_sensor, tanggal, nilai, waktu
        FROM sensor
        ORDER BY waktu DESC
        LIMIT 10
        """
        cursor.execute(query)
        sample_data = cursor.fetchall()
        
        # Get database info
        info_query = "SELECT COUNT(*) as total FROM sensor"
        cursor.execute(info_query)
        total_count = cursor.fetchone()['total']
        
        cursor.close()
        conn.close()
        
        return {
            "debug_info": {
                "total_records_in_db": total_count,
                "sample_data_count": len(sample_data),
                "database_connected": True
            },
            "sample_data": sample_data
        }
        
    except Exception as e:
        return {
            "debug_info": {
                "error": str(e),
                "database_connected": False
            },
            "sample_data": []
        }

@app.get("/")
async def root():
    return {"message": "Sensor Monitoring API"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)