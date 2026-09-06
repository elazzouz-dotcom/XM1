import pandas as pd
import numpy as np

def data_processing_pipeline(raw_data_path):
    # الخطوة 1: الاستيعاب
    try:
        df = pd.read_csv(raw_data_path)
    except Exception as e:
        return f"فشل تحميل البيانات: {e}"

    # الخطوة 2: التنظيف (إزالة التكرارات ومعالجة القيم المفقودة)
    df = df.drop_duplicates()
    
    # تعويض القيم العددية الناقصة بالمتوسط، والنصية بـ "غير معروف"
    for col in df.columns:
        if df[col].dtype in [np.float64, np.int64]:
            df[col] = df[col].fillna(df[col].mean())
        else:
            df[col] = df[col].fillna("Unknown")

    # الخطوة 3: التحويل (توحيد النصوص وتطبيع البيانات العددية)
    if 'email' in df.columns:
        df['email'] = df['email'].str.lower().str.strip()
        
    # مثال على تطبيع عمود عددي (Min-Max Normalization)
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        min_val = df[col].min()
        max_val = df[col].max()
        if max_val - min_val > 0:
            df[col] = (df[col] - min_val) / (max_val - min_val)

    # الخطوة 4: التخزين النهائي
    output_path = "processed_data.csv"
    df.to_csv(output_path, index=False)
    
    return f"تمت معالجة {len(df)} سجلاً بنجاح وحفظها في {output_path}"

# مثال للاستخدام:
# result = data_processing_pipeline("raw_data.csv")
# print(result)
