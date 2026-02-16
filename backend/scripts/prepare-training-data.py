#!/usr/bin/env python3
"""
AI Training Module: Load abusive samples from CSV using pandas and prepare for training
Integrates with Node.js backend via JSON output
"""

import pandas as pd
import json
import sys
from pathlib import Path

def load_and_process_training_data(csv_path):
    """Load CSV and extract abusive samples"""
    
    print(f"\n📂 Loading training data from: {csv_path}")
    print("=" * 60)
    
    try:
        # Load the CSV file
        df = pd.read_csv(csv_path)
        print(f"✅ CSV loaded successfully!")
        print(f"   Total rows: {len(df)}")
        print(f"   Columns: {', '.join(df.columns.tolist())}")
        
        # Extract abusive samples
        abusive_samples = df[df['is_abusive'] == True]
        safe_samples = df[df['is_abusive'] == False]
        
        print(f"\n📊 Data Distribution:")
        print(f"   Abusive samples: {len(abusive_samples)} ({len(abusive_samples)/len(df)*100:.1f}%)")
        print(f"   Safe samples: {len(safe_samples)} ({len(safe_samples)/len(df)*100:.1f}%)")
        
        # Prepare training data in JSON format
        training_data = {
            "metadata": {
                "total_samples": len(df),
                "abusive_count": len(abusive_samples),
                "safe_count": len(safe_samples),
                "source": csv_path
            },
            "abusive_samples": abusive_samples.to_dict('records'),
            "safe_samples": safe_samples.to_dict('records')
        }
        
        # Analyze patterns
        if 'category' in df.columns:
            print(f"\n📋 Categories found:")
            print(df['category'].value_counts().to_string())
        
        if 'severity' in df.columns:
            print(f"\n⚠️  Severity distribution:")
            print(df['severity'].value_counts().to_string())
        
        return training_data, abusive_samples, df
        
    except FileNotFoundError:
        print(f"❌ Error: File not found at {csv_path}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error processing CSV: {str(e)}")
        sys.exit(1)

def generate_training_summary(abusive_samples, all_df):
    """Generate insights from the training data"""
    
    print(f"\n🔍 Training Data Insights:")
    print("=" * 60)
    
    if not abusive_samples.empty:
        # Most common words in abusive content
        if 'text' in abusive_samples.columns:
            all_text = ' '.join(abusive_samples['text'].astype(str))
            words = all_text.lower().split()
            from collections import Counter
            most_common = Counter(words).most_common(10)
            print("   Top words in abusive samples:")
            for word, count in most_common:
                if len(word) > 3:
                    print(f"      - {word}: {count} occurrences")
    
    # Suggest category thresholds
    if 'category' in abusive_samples.columns:
        print("\n   Abusive content by category:")
        for category, count in abusive_samples['category'].value_counts().items():
            print(f"      - {category}: {count} samples")
    
    print("\n✨ Ready for AI training!")

if __name__ == "__main__":
    csv_path = sys.argv[1] if len(sys.argv) > 1 else 'processed_data/training_dataset.csv'
    
    training_data, abusive_samples, all_df = load_and_process_training_data(csv_path)
    generate_training_summary(abusive_samples, all_df)
    
    # Save as JSON for Node.js backend to consume
    output_path = Path(csv_path).parent / "training_data.json"
    with open(output_path, 'w') as f:
        json.dump(training_data, f, indent=2)
    
    print(f"\n💾 Training data exported to: {output_path}")
    print("=" * 60 + "\n")
