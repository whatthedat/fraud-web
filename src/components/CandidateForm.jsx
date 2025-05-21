import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function CandidateForm({ editMode = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    description: '',
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCreator, setIsCreator] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (editMode && id) {
      fetchCandidate();
    }
  }, [editMode, id]);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser && editMode && id) {
      const checkIfCreator = async () => {
        const { data, error } = await supabase
          .from('fraud_candidates')
          .select('added_by')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) {
          setIsCreator(data.added_by === currentUser.email);
        }
      };
      checkIfCreator();
    }
  }, [currentUser, editMode, id]);

  const fetchCandidate = async () => {
    try {
      const { data, error } = await supabase
        .from('fraud_candidates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          description: data.description || '',
        });
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  const uploadFile = async (file, userId) => {
    if (!file || !userId) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    // Include user ID in the file path for better organization and RLS
    const filePath = `${userId}/${fileName}`;
    
    console.log('Uploading file:', file.name, 'as', filePath);
    
    try {
      // Upload the file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
      
      console.log('File uploaded successfully:', uploadData);
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);
      
      console.log('Public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error in file upload:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get the current user session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');
      
      console.log('Current user:', user);

      // Upload file first if exists
      let resumeUrl = '';
      if (resumeFile) {
        resumeUrl = await uploadFile(resumeFile, user.id);
      }

      console.log(resumeUrl)

      // Prepare candidate data
      const candidateData = {
        ...formData,
        added_by: user.email || 'unknown@example.com',
        ...(resumeUrl && { resume_url: resumeUrl })
      };
      
      console.log('Submitting candidate data:', candidateData);

      if (editMode) {
        const { data, error: updateError } = await supabase
          .from('fraud_candidates')
          .update(candidateData)
          .eq('id', id);
        
        console.log('Update response:', { data, error: updateError });
        if (updateError) {
          console.error('Update error details:', updateError);
          throw updateError;
        }
      } else {
        console.log('Inserting candidate data...');
        const { data, error: insertError } = await supabase
          .from('fraud_candidates')
          .insert([candidateData])
          .select();
        
        console.log('Insert response:', { data, error: insertError });
        if (insertError) {
          console.error('Insert error details:', insertError);
          throw insertError;
        }
      }

      navigate('/');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to view the uploaded resume
  const viewResume = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) return <div>Loading...</div>;
  if (!isCreator) return <div className="error">{error || 'Access Denied'}</div>;

  return (
    <div className="candidate-form">
      <h2>{editMode ? 'Edit' : 'Add New'} Fraud Candidate</h2>
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label>Description of Fraud</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
          />
        </div>
        
        <div className="form-group">
          <label>Resume {!editMode && '(Optional)'}</label>
          <div className="file-upload-container">
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={loading}
              style={{ display: 'none' }}
            />
            <div className="file-upload-buttons">
              <label htmlFor="resume-upload" className="upload-button">
                {resumeFile ? 'Change File' : 'Choose File'}
              </label>
              {formData.resume_url && (
                <button
                  type="button"
                  className="view-button"
                  onClick={() => viewResume(formData.resume_url)}
                  disabled={!formData.resume_url}
                >
                  View Uploaded Resume
                </button>
              )}
            </div>
            {resumeFile && (
              <div className="file-name">
                Selected: {resumeFile.name}
              </div>
            )}
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={() => navigate('/')} disabled={loading}>
            Cancel
          </button>
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
